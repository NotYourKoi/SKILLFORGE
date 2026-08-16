import { prisma } from "@/lib/db";
import {
  AI_DISABLED_MESSAGE,
  AI_TEMP_UNAVAILABLE_MESSAGE,
  AI_UNAVAILABLE_MESSAGE,
  aiLimits,
  isAIEnabled,
} from "./config";
import {
  buildTutorContext,
  formatDebugSection,
  sanitizeDebugInput,
  sanitizeText,
} from "./context";
import { buildSystemPrompt, buildUserPrompt } from "./prompts";
import { getAIProvider, ProviderError } from "./provider";
import { globalRateLimiter } from "./rate-limit";
import { isTutorMode, type AIChatMessage, type TutorContextData, type TutorMode } from "./types";
import { levelFromXp } from "@/lib/progression/levels";
import { getTotalXp } from "@/lib/progression/xp";
import { getStoredStreak } from "@/lib/progression/streaks";

export const RATE_LIMIT_MESSAGE =
  "You're sending requests too quickly. Please wait a moment and try again.";

export interface AskTutorInput {
  mode: TutorMode;
  question: string;
  conversationId?: string;
  skillId?: string;
  lessonId?: string;
  exerciseId?: string;
  quiz?: { id: string; questionId: string; afterSubmit: boolean; selectedOptionText?: string };
  debug?: { code?: string; output?: string; error?: string };
}

export type TutorOutcome =
  | { ok: true; data: { reply: string; conversationId: string } }
  | { ok: false; error: string };

export function validateTutorInput(input: AskTutorInput):
  | { ok: true; data: { mode: TutorMode; question: string } }
  | { ok: false; error: string } {
  if (!isTutorMode(input.mode)) {
    return { ok: false, error: "Invalid tutor action." };
  }
  if (typeof input.question !== "string") {
    return { ok: false, error: "Please enter a question." };
  }
  const question = input.question.trim();
  if (question.length === 0) {
    return { ok: false, error: "Please enter a question." };
  }
  const limits = aiLimits();
  if (question.length > limits.maxMessageLength) {
    return {
      ok: false,
      error: `Your question is too long (max ${limits.maxMessageLength} characters).`,
    };
  }
  if (input.debug?.code && input.debug.code.length > limits.maxCodeLength) {
    return { ok: false, error: "Your code is too long to send to the tutor." };
  }
  if (input.quiz) {
    if (
      typeof input.quiz.id !== "string" ||
      input.quiz.id.trim().length === 0 ||
      typeof input.quiz.questionId !== "string" ||
      input.quiz.questionId.trim().length === 0
    ) {
      return { ok: false, error: "Invalid quiz context." };
    }
  }
  return { ok: true, data: { mode: input.mode, question } };
}

function parseList(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function parseExamples(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x) => x && typeof x === "object" && "input" in x && "output" in x)
      .map((x) => `input: ${x.input}\noutput: ${x.output}`);
  } catch {
    return [];
  }
}

async function loadPrerequisiteNames(skillId: string): Promise<string[]> {
  const rows = await prisma.prerequisite.findMany({
    where: { skillId },
    select: { prereq: { select: { name: true } } },
  });
  return rows.map((row) => row.prereq.name);
}

interface ResolvedScopes {
  skillId?: string;
  lessonId?: string;
  exerciseId?: string;
}

async function resolveConversation(
  userId: string,
  input: AskTutorInput,
  scopes: ResolvedScopes,
): Promise<TutorOutcome | { conversationId: string; createdAt: boolean }> {
  if (input.conversationId) {
    const conversation = await prisma.tutorConversation.findFirst({
      where: { id: input.conversationId, userId },
      select: { id: true, skillId: true, lessonId: true, exerciseId: true },
    });
    if (!conversation) {
      return { ok: false, error: "Conversation not found." };
    }
    const scopedByLessonOrExercise = conversation.lessonId !== null || conversation.exerciseId !== null;
    const mismatch =
      (scopes.lessonId !== undefined && conversation.lessonId !== scopes.lessonId) ||
      (scopes.exerciseId !== undefined && conversation.exerciseId !== scopes.exerciseId) ||
      (scopes.skillId !== undefined &&
        conversation.skillId !== null &&
        conversation.skillId !== scopes.skillId &&
        !scopedByLessonOrExercise);
    if (mismatch) {
      return { ok: false, error: "This question does not match the conversation context." };
    }
    return { conversationId: conversation.id, createdAt: false };
  }

  const created = await prisma.tutorConversation.create({
    data: {
      userId,
      skillId: scopes.skillId ?? null,
      lessonId: scopes.lessonId ?? null,
      exerciseId: scopes.exerciseId ?? null,
    },
    select: { id: true },
  });
  return { conversationId: created.id, createdAt: true };
}

/**
 * The core AI Tutor service. Called only from server actions — never from page
 * render. All AI calls happen exclusively when the student explicitly asks.
 */
export async function runTutor(userId: string, input: AskTutorInput): Promise<TutorOutcome> {
  const validated = validateTutorInput(input);
  if (!validated.ok) return validated;

  const { mode, question } = validated.data;
  const limits = aiLimits();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, aiEnabled: true },
  });
  if (!user) return { ok: false, error: "Not signed in." };
  if (!user.aiEnabled) return { ok: false, error: AI_DISABLED_MESSAGE };

  if (!isAIEnabled()) return { ok: false, error: AI_UNAVAILABLE_MESSAGE };

  const rate = globalRateLimiter.hit(userId);
  if (!rate.allowed) return { ok: false, error: RATE_LIMIT_MESSAGE };

  const contextData: TutorContextData = {};
  const scopes: ResolvedScopes = {};

  if (input.debug) {
    const sanitized = sanitizeDebugInput(input.debug);
    contextData._debug = formatDebugSection(sanitized);
  }

  if (input.lessonId) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: input.lessonId },
      select: {
        id: true,
        title: true,
        description: true,
        difficulty: true,
        skill: {
          select: {
            id: true,
            name: true,
            description: true,
            tier: true,
            difficulty: true,
            objectives: true,
          },
        },
      },
    });
    if (!lesson) return { ok: false, error: "Lesson not found." };
    scopes.skillId = lesson.skill.id;
    scopes.lessonId = lesson.id;
    const objectives = parseList(lesson.skill.objectives);
    contextData.skill = {
      id: lesson.skill.id,
      name: lesson.skill.name,
      description: lesson.skill.description,
      tier: lesson.skill.tier,
      objectives,
      difficulty: lesson.skill.difficulty,
    };
    contextData.lesson = {
      title: lesson.title,
      description: lesson.description,
      objectives,
      difficulty: lesson.difficulty,
    };
    contextData.prerequisites = await loadPrerequisiteNames(lesson.skill.id);
  } else if (input.exerciseId) {
    const exercise = await prisma.exercise.findUnique({
      where: { id: input.exerciseId },
      select: {
        id: true,
        title: true,
        prompt: true,
        description: true,
        language: true,
        difficulty: true,
        requirements: true,
        constraints: true,
        examples: true,
        skill: {
          select: {
            id: true,
            name: true,
            description: true,
            tier: true,
            difficulty: true,
            objectives: true,
          },
        },
      },
    });
    if (!exercise) return { ok: false, error: "Exercise not found." };
    scopes.skillId = exercise.skill.id;
    scopes.exerciseId = exercise.id;
    contextData.skill = {
      id: exercise.skill.id,
      name: exercise.skill.name,
      description: exercise.skill.description,
      tier: exercise.skill.tier,
      objectives: parseList(exercise.skill.objectives),
      difficulty: exercise.skill.difficulty,
    };
    contextData.exercise = {
      title: exercise.title,
      prompt: exercise.prompt,
      description: exercise.description,
      language: exercise.language,
      difficulty: exercise.difficulty,
      requirements: parseList(exercise.requirements),
      constraints: parseList(exercise.constraints),
      examples: parseExamples(exercise.examples),
    };
    contextData.prerequisites = await loadPrerequisiteNames(exercise.skill.id);
  } else if (input.quiz) {
    const question = await prisma.question.findUnique({
      where: { id: input.quiz.questionId },
      include: {
        options: { orderBy: { order: "asc" } },
        quiz: { select: { id: true, skillId: true } },
      },
    });
    if (!question || question.quiz.id !== input.quiz.id) {
      return { ok: false, error: "Question not found." };
    }
    scopes.skillId = question.quiz.skillId;
    const correct = question.options.find((o) => o.isCorrect)?.text ?? "";
    contextData.quiz = {
      question: question.prompt,
      options: question.options.map((o) => o.text),
      afterSubmit: input.quiz.afterSubmit,
      selectedOption: input.quiz.selectedOptionText,
      correctOption: input.quiz.afterSubmit ? correct : undefined,
      explanation: input.quiz.afterSubmit ? question.explanation : undefined,
    };
  } else if (input.skillId) {
    const skill = await prisma.skill.findUnique({
      where: { id: input.skillId },
      select: {
        id: true,
        name: true,
        description: true,
        tier: true,
        difficulty: true,
        objectives: true,
      },
    });
    if (!skill) return { ok: false, error: "Skill not found." };
    scopes.skillId = skill.id;
    contextData.skill = {
      id: skill.id,
      name: skill.name,
      description: skill.description,
      tier: skill.tier,
      objectives: parseList(skill.objectives),
      difficulty: skill.difficulty,
    };
    contextData.prerequisites = await loadPrerequisiteNames(skill.id);
  }

  const conversation = await resolveConversation(userId, input, scopes);
  if (!("conversationId" in conversation)) return conversation;

  const [totalXp, storedStreak, completedSkills, lessonsCompleted, exercisesSolved] =
    await Promise.all([
      getTotalXp(userId),
      getStoredStreak(userId),
      prisma.userSkill.findMany({
        where: { userId, completed: true },
        select: { skill: { select: { name: true } } },
      }),
      prisma.lessonProgress.count({ where: { userId, completed: true } }),
      prisma.userExerciseProgress.count({ where: { userId, solved: true } }),
    ]);

  contextData.userProgress = {
    level: levelFromXp(totalXp).level,
    totalXp,
    currentStreak: storedStreak.currentStreak,
    skillsCompleted: completedSkills.length,
    lessonsCompleted,
    exercisesSolved,
    completedSkillNames: completedSkills.map((row) => row.skill.name),
  };

  const context = buildTutorContext(contextData);
  const systemPrompt = buildSystemPrompt(mode, context);

  const history = await prisma.tutorMessage.findMany({
    where: { conversationId: conversation.conversationId },
    orderBy: { createdAt: "asc" },
    take: limits.maxHistoryMessages * 2,
    select: { role: true, action: true, content: true },
  });
  const historyMessages: AIChatMessage[] = history.map((message) =>
    message.role === "assistant"
      ? { role: "assistant", content: sanitizeText(message.content, 4000) }
      : {
          role: "user",
          content: buildUserPrompt(
            (message.action as TutorMode) || "ASK",
            sanitizeText(message.content, 4000),
          ),
        },
  );

  let currentUserPrompt = buildUserPrompt(mode, question);
  if (contextData._debug) currentUserPrompt += `\n\n${contextData._debug}`;

  const provider = getAIProvider();
  if (!provider) return { ok: false, error: AI_UNAVAILABLE_MESSAGE };

  let result;
  try {
    result = await provider.chat(
      [
        { role: "system", content: systemPrompt },
        ...historyMessages,
        { role: "user", content: currentUserPrompt },
      ],
      { maxOutputTokens: limits.maxOutputTokens, timeoutMs: limits.requestTimeoutMs },
    );
  } catch (error) {
    await recordUsage({
      userId,
      provider: provider.name,
      model: provider.model,
      action: mode,
      success: false,
      promptTokens: 0,
      completionTokens: 0,
      durationMs: 0,
    });
    const message = error instanceof ProviderError ? error.message : String(error);
    console.warn(`[ai-tutor] ${provider.name} request failed: ${message}`);
    return { ok: false, error: AI_TEMP_UNAVAILABLE_MESSAGE };
  }

  const reply = result.content;
  const title = conversation.createdAt
    ? question.slice(0, 60)
    : undefined;

  try {
    await prisma.$transaction([
      prisma.tutorMessage.create({
        data: {
          conversationId: conversation.conversationId,
          role: "user",
          action: mode,
          content: question,
        },
      }),
      prisma.tutorMessage.create({
        data: {
          conversationId: conversation.conversationId,
          role: "assistant",
          action: mode,
          content: reply,
        },
      }),
      prisma.tutorConversation.update({
        where: { id: conversation.conversationId },
        data: { ...(title ? { title } : {}) },
      }),
    ]);
    await trimConversation(conversation.conversationId, limits.maxStoredMessages);
  } catch (error) {
    // Persistence is best-effort; the reply itself is unaffected.
    console.warn("[ai-tutor] could not persist conversation:", String(error));
  }

  await recordUsage({
    userId,
    provider: result.provider,
    model: result.model,
    action: mode,
    success: true,
    promptTokens: result.promptTokens,
    completionTokens: result.completionTokens,
    durationMs: result.durationMs,
  });

  return { ok: true, data: { reply, conversationId: conversation.conversationId } };
}

async function trimConversation(conversationId: string, maxStored: number): Promise<void> {
  const count = await prisma.tutorMessage.count({ where: { conversationId } });
  if (count <= maxStored) return;
  const keepFrom = await prisma.tutorMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    skip: count - maxStored,
    take: 1,
    select: { createdAt: true },
  });
  if (keepFrom.length === 0) return;
  await prisma.tutorMessage.deleteMany({
    where: { conversationId, createdAt: { lt: keepFrom[0].createdAt } },
  });
}

export interface AiUsageRecord {
  userId: string;
  provider: string;
  model: string;
  action: string;
  success: boolean;
  promptTokens: number;
  completionTokens: number;
  durationMs: number;
}

export async function recordUsage(record: AiUsageRecord): Promise<void> {
  try {
    await prisma.aiUsage.create({
      data: {
        userId: record.userId,
        provider: record.provider,
        model: record.model,
        action: record.action,
        success: record.success,
        promptTokens: record.promptTokens,
        completionTokens: record.completionTokens,
        durationMs: record.durationMs,
      },
    });
  } catch {
    // Usage tracking must never break the tutor flow.
  }
}
