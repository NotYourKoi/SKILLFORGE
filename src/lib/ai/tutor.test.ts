import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next-auth", () => {
  class AuthError extends Error {
    type: string;
    constructor(type = "") {
      super("Authentication error");
      this.type = type;
    }
  }
  return { AuthError };
});

vi.mock("@/auth", () => ({
  auth: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@/lib/exercises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/exercises")>();
  return { ...actual, submitExercise: vi.fn() };
});

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { askTutor, setAiPreference } from "@/lib/actions";
import {
  runTutor,
  validateTutorInput,
  RATE_LIMIT_MESSAGE,
  type AskTutorInput,
} from "@/lib/ai/tutor";
import { globalRateLimiter } from "@/lib/ai/rate-limit";
import { AI_UNAVAILABLE_MESSAGE, AI_TEMP_UNAVAILABLE_MESSAGE, AI_DISABLED_MESSAGE } from "@/lib/ai/config";

const authMock = vi.mocked(auth);

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const userIds: string[] = [];
const skillIds: string[] = [];
const lessonIds: string[] = [];
const quizIds: string[] = [];
const exerciseIds: string[] = [];
const conversationIds: string[] = [];

async function createUser(overrides: { aiEnabled?: boolean } = {}): Promise<string> {
  const suffix = uid("u");
  const user = await prisma.user.create({
    data: {
      username: suffix,
      email: `${suffix}@test.local`,
      passwordHash: "not-a-real-hash",
      ...(overrides.aiEnabled === undefined ? {} : { aiEnabled: overrides.aiEnabled }),
    },
  });
  userIds.push(user.id);
  return user.id;
}

async function createSkill(id?: string): Promise<string> {
  const skillId = id ?? uid("s");
  skillIds.push(skillId);
  await prisma.skill.create({
    data: { id: skillId, name: `Skill ${skillId}`, description: "desc", tier: "Core", x: 0, y: 0 },
  });
  return skillId;
}

async function createLesson(skillId: string): Promise<string> {
  const id = uid("l");
  lessonIds.push(id);
  await prisma.lesson.create({
    data: {
      id,
      skillId,
      title: "Lesson",
      description: "lesson desc",
      estimatedMinutes: 10,
      difficulty: "Easy",
      order: 0,
      content: "[]",
      checkpoints: "[]",
    },
  });
  return id;
}

async function createExercise(skillId: string): Promise<string> {
  const id = uid("e");
  exerciseIds.push(id);
  await prisma.exercise.create({
    data: {
      id,
      skillId,
      title: "Exercise",
      prompt: "Sum the list",
      description: "",
      language: "python",
      difficulty: "Easy",
      order: 0,
      requirements: JSON.stringify(["Return an int"]),
      solution: "SOLUTION_SECRET_TEXT",
      starterCode: "def sum_list(xs):\n    pass",
      hints: "[]",
      testCases: {
        create: [
          {
            input: "1 2 3",
            expectedOutput: "6",
            description: "visible case",
            isPublic: true,
            order: 0,
          },
          {
            input: "SECRET_INPUT",
            expectedOutput: "HIDDEN_OUTPUT_SECRET",
            description: "HIDDEN_DESC_SECRET",
            isPublic: false,
            order: 1,
          },
        ],
      },
    },
  });
  return id;
}

async function createQuiz(skillId: string): Promise<{ quizId: string; questionId: string; options: { text: string; isCorrect: boolean }[]; explanation: string }> {
  const quiz = await prisma.quiz.create({
    data: {
      skillId,
      title: "Quiz",
      passScore: 70,
      questions: {
        create: [
          {
            prompt: "What is 2+2?",
            order: 0,
            explanation: "SECRET_EXPLANATION_TEXT",
            options: {
              create: [
                { text: "Three", isCorrect: false, order: 0 },
                { text: "Four", isCorrect: true, order: 1 },
              ],
            },
          },
        ],
      },
    },
    include: { questions: { include: { options: true } } },
  });
  quizIds.push(quiz.id);
  const question = quiz.questions[0];
  return {
    quizId: quiz.id,
    questionId: question.id,
    options: question.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })),
    explanation: question.explanation,
  };
}

async function cleanup(): Promise<void> {
  for (const id of conversationIds) {
    await prisma.tutorConversation.delete({ where: { id } }).catch(() => {});
  }
  conversationIds.length = 0;
  await prisma.aiUsage.deleteMany({ where: { userId: { in: userIds } } }).catch(() => {});
  for (const id of userIds) {
    await prisma.user.delete({ where: { id } }).catch(() => {});
  }
  userIds.length = 0;
  for (const id of lessonIds) {
    await prisma.lesson.delete({ where: { id } }).catch(() => {});
  }
  lessonIds.length = 0;
  for (const id of quizIds) {
    await prisma.quiz.delete({ where: { id } }).catch(() => {});
  }
  quizIds.length = 0;
  for (const id of exerciseIds) {
    await prisma.exercise.delete({ where: { id } }).catch(() => {});
  }
  exerciseIds.length = 0;
  for (const id of skillIds) {
    await prisma.skill.delete({ where: { id } }).catch(() => {});
  }
  skillIds.length = 0;
}

function geminiSuccess(text = "Tutor reply") {
  return new Response(
    JSON.stringify({
      candidates: [{ content: { parts: [{ text }] } }],
      usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

function requestTexts(fetchMock: ReturnType<typeof vi.fn>): { system: string; user: string } {
  const [, init] = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
  const body = JSON.parse(String((init as RequestInit).body));
  const contents = body.contents as { role: string; parts: { text: string }[] }[];
  const system = contents.find((c) => c.role === "system")?.parts.map((p) => p.text).join("") ?? "";
  const user = contents
    .filter((c) => c.role !== "system")
    .map((c) => c.parts.map((p) => p.text).join(""))
    .join(" ");
  return { system, user };
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue(null as never);
  globalRateLimiter.reset();
  vi.stubEnv("AI_PROVIDER", "gemini");
  vi.stubEnv("AI_API_KEY", "test-key");
  vi.stubEnv("AI_MODEL", "gemini-test");
  fetchMock = vi.fn().mockImplementation(() =>
    Promise.resolve(geminiSuccess("Here is a nudge, not the answer.")),
  );
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(async () => {
  await cleanup();
  globalRateLimiter.reset();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function ask(input: AskTutorInput, userId: string) {
  return runTutor(userId, input);
}

describe("message validation", () => {
  it("rejects an invalid mode", () => {
    const result = validateTutorInput({ mode: "GIVE_SOLUTION" as never, question: "hi" });
    expect(result.ok).toBe(false);
  });

  it("rejects an empty question", () => {
    expect(validateTutorInput({ mode: "ASK", question: "   " }).ok).toBe(false);
    expect(validateTutorInput({ mode: "ASK", question: "" as never }).ok).toBe(false);
  });

  it("rejects an oversized question", () => {
    vi.stubEnv("AI_MAX_MESSAGE_LENGTH", "2000");
    const result = validateTutorInput({ mode: "ASK", question: "x".repeat(2001) });
    expect(result.ok).toBe(false);
  });

  it("rejects oversized code submissions", () => {
    vi.stubEnv("AI_MAX_CODE_LENGTH", "8000");
    const result = validateTutorInput({
      mode: "DEBUG",
      question: "why",
      debug: { code: "x".repeat(8001) },
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a malformed quiz context", () => {
    expect(
      validateTutorInput({ mode: "ASK", question: "hi", quiz: { id: "q", questionId: "", afterSubmit: false } }).ok,
    ).toBe(false);
    expect(
      validateTutorInput({ mode: "ASK", question: "hi", quiz: { id: "", questionId: "qq", afterSubmit: false } }).ok,
    ).toBe(false);
  });
});

describe("tutor availability", () => {
  it("returns unavailable when the provider is not configured", async () => {
    vi.stubEnv("AI_PROVIDER", "");
    vi.stubEnv("AI_API_KEY", "");
    const userId = await createUser();
    const result = await ask({ mode: "ASK", question: "hello" }, userId);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe(AI_UNAVAILABLE_MESSAGE);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns disabled message when the user turned the tutor off", async () => {
    const userId = await createUser({ aiEnabled: false });
    const result = await ask({ mode: "ASK", question: "hello" }, userId);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe(AI_DISABLED_MESSAGE);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a signed-out user at the action boundary", async () => {
    const res = await askTutor({ mode: "ASK", question: "hello" });
    expect(res.error).toBe("Not signed in");
  });
});

describe("rate limiting", () => {
  it("blocks requests beyond the window limit", async () => {
    vi.stubEnv("AI_RATE_LIMIT_REQUESTS", "1");
    vi.stubEnv("AI_RATE_LIMIT_WINDOW_MS", "60000");
    const userId = await createUser();
    const first = await ask({ mode: "ASK", question: "first" }, userId);
    expect(first.ok).toBe(true);
    const second = await ask({ mode: "ASK", question: "second" }, userId);
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.error).toBe(RATE_LIMIT_MESSAGE);
  });

  it("allows requests again after the window passes", async () => {
    vi.stubEnv("AI_RATE_LIMIT_REQUESTS", "1");
    vi.stubEnv("AI_RATE_LIMIT_WINDOW_MS", "1");
    const userId = await createUser();
    expect((await ask({ mode: "ASK", question: "a" }, userId)).ok).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 5));
    expect((await ask({ mode: "ASK", question: "b" }, userId)).ok).toBe(true);
  });
});

describe("provider failure handling", () => {
  it("returns a graceful message and records a failed usage entry", async () => {
    const userId = await createUser();
    fetchMock.mockResolvedValueOnce(new Response("bad", { status: 500 }));
    const result = await ask({ mode: "ASK", question: "hello" }, userId);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe(AI_TEMP_UNAVAILABLE_MESSAGE);

    const usage = await prisma.aiUsage.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } });
    expect(usage).not.toBeNull();
    expect(usage!.success).toBe(false);
    expect(usage!.provider).toBe("gemini");
    expect(usage!.action).toBe("ASK");
  });

  it("handles a malformed provider response gracefully", async () => {
    const userId = await createUser();
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ candidates: [] }), { status: 200 }));
    const result = await ask({ mode: "ASK", question: "hello" }, userId);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe(AI_TEMP_UNAVAILABLE_MESSAGE);
  });

  it("handles a network failure gracefully", async () => {
    const userId = await createUser();
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    const result = await ask({ mode: "ASK", question: "hello" }, userId);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe(AI_TEMP_UNAVAILABLE_MESSAGE);
  });
});

describe("tutor actions", () => {
  it("answers, persists a conversation and records usage", async () => {
    const userId = await createUser();
    const skillId = await createSkill();
    const lessonId = await createLesson(skillId);

    const result = await ask({ mode: "EXPLAIN", question: "Explain loops", lessonId, skillId }, userId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.reply).toBe("Here is a nudge, not the answer.");

    const conversation = await prisma.tutorConversation.findUnique({
      where: { id: result.data.conversationId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    conversationIds.push(result.data.conversationId);
    expect(conversation).not.toBeNull();
    expect(conversation!.lessonId).toBe(lessonId);
    expect(conversation!.skillId).toBe(skillId);
    expect(conversation!.title).toBe("Explain loops");
    expect(conversation!.messages).toHaveLength(2);
    expect(conversation!.messages[0].role).toBe("user");
    expect(conversation!.messages[1].role).toBe("assistant");

    const usage = await prisma.aiUsage.findFirst({ where: { userId } });
    expect(usage).not.toBeNull();
    expect(usage!.success).toBe(true);
    expect(usage!.provider).toBe("gemini");
    expect(usage!.model).toBe("gemini-test");
    expect(usage!.action).toBe("EXPLAIN");
  });

  it("reuses a conversation and includes history in the next prompt", async () => {
    const userId = await createUser();
    const skillId = await createSkill();
    const lessonId = await createLesson(skillId);

    const first = await ask({ mode: "EXPLAIN", question: "First question", lessonId, skillId }, userId);
    if (!first.ok) throw new Error("first ask failed");
    conversationIds.push(first.data.conversationId);

    fetchMock.mockResolvedValueOnce(geminiSuccess("Second reply."));
    const second = await ask(
      { mode: "ASK", question: "Follow up", conversationId: first.data.conversationId, lessonId, skillId },
      userId,
    );
    expect(second.ok).toBe(true);

    const { system, user } = requestTexts(fetchMock);
    expect(system).toContain("Current lesson");
    expect(user).toContain("First question");
    expect(user).toContain("Here is a nudge, not the answer.");

    const count = await prisma.tutorMessage.count({ where: { conversationId: first.data.conversationId } });
    expect(count).toBe(4);
  });

  it("rejects reuse of another user's conversation", async () => {
    const userIdA = await createUser();
    const userIdB = await createUser();
    const skillId = await createSkill();
    const lessonId = await createLesson(skillId);

    const first = await ask({ mode: "ASK", question: "private", lessonId, skillId }, userIdA);
    if (!first.ok) throw new Error("first ask failed");
    conversationIds.push(first.data.conversationId);

    const result = await ask(
      { mode: "ASK", question: "snoop", conversationId: first.data.conversationId },
      userIdB,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("Conversation not found.");
  });

  it("rejects a conversation reused in a different context", async () => {
    const userId = await createUser();
    const skillId = await createSkill();
    const lessonA = await createLesson(skillId);
    const lessonB = await createLesson(skillId);

    const first = await ask({ mode: "ASK", question: "in lesson A", lessonId: lessonA, skillId }, userId);
    if (!first.ok) throw new Error("first ask failed");
    conversationIds.push(first.data.conversationId);

    const result = await ask(
      { mode: "ASK", question: "now in lesson B", conversationId: first.data.conversationId, lessonId: lessonB, skillId },
      userId,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("This question does not match the conversation context.");
  });

  it("returns an error for an unknown lesson", async () => {
    const userId = await createUser();
    const result = await ask({ mode: "ASK", question: "hi", lessonId: "does-not-exist" }, userId);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("Lesson not found.");
  });

  it("returns an error for an unknown exercise", async () => {
    const userId = await createUser();
    const result = await ask({ mode: "ASK", question: "hi", exerciseId: "does-not-exist" }, userId);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("Exercise not found.");
  });

  it("answers skill-level questions with prerequisite context", async () => {
    const userId = await createUser();
    const prereq = await createSkill();
    const skillId = await createSkill();
    await prisma.prerequisite.create({
      data: { skillId, prereqId: prereq },
    });
    const result = await ask({ mode: "EXPLAIN", question: "What is this skill?", skillId }, userId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const { system } = requestTexts(fetchMock);
    expect(system).toContain("Current skill");
    expect(system).toContain("Prerequisite skills");
  });
});

describe("exercise integration safety", () => {
  it("never sends the solution or hidden test cases to the model", async () => {
    const userId = await createUser();
    const skillId = await createSkill();
    const exerciseId = await createExercise(skillId);

    const result = await ask({ mode: "HINT", question: "Give me a hint", exerciseId, skillId }, userId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const { system, user } = requestTexts(fetchMock);
    expect(system).toContain("Current exercise");
    expect(user).toContain("Give me a hint");
    expect(user).not.toContain("SOLUTION_SECRET_TEXT");
    expect(user).not.toContain("HIDDEN_OUTPUT_SECRET");
    expect(user).not.toContain("HIDDEN_DESC_SECRET");
    expect(user).not.toContain("SECRET_INPUT");
    expect(system).not.toContain("SOLUTION_SECRET_TEXT");
    expect(system).not.toContain("HIDDEN_OUTPUT_SECRET");
  });

  it("includes student code and visible output in DEBUG mode", async () => {
    const userId = await createUser();
    const skillId = await createSkill();
    const exerciseId = await createExercise(skillId);

    const result = await ask(
      {
        mode: "DEBUG",
        question: "Why doesn't my code work?",
        exerciseId,
        skillId,
        debug: { code: "def sum_list(xs): return 0", output: "0", error: "wrong answer" },
      },
      userId,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const { user } = requestTexts(fetchMock);
    expect(user).toContain("Student's current code");
    expect(user).toContain("def sum_list(xs): return 0");
    expect(user).toContain("wrong answer");
  });
});

describe("quiz integration safety", () => {
  it("does not reveal the answer before submission", async () => {
    const userId = await createUser();
    const skillId = await createSkill();
    const { quizId, questionId } = await createQuiz(skillId);

    const result = await ask(
      { mode: "EXPLAIN", question: "Explain this question", quiz: { id: quizId, questionId, afterSubmit: false } },
      userId,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const { system, user } = requestTexts(fetchMock);
    expect(system).toContain("NOT yet submitted — do NOT reveal the answer");
    expect(system).toContain("What is 2+2?");
    expect(user).toContain("Explain this question");
    expect(system).not.toContain("SECRET_EXPLANATION_TEXT");
    expect(system).not.toContain("Correct option");
  });

  it("may explain the answer after submission", async () => {
    const userId = await createUser();
    const skillId = await createSkill();
    const { quizId, questionId } = await createQuiz(skillId);

    const result = await ask(
      {
        mode: "EXPLAIN_ANSWER",
        question: "Why was I wrong?",
        quiz: { id: quizId, questionId, afterSubmit: true, selectedOptionText: "Three" },
      },
      userId,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const { system, user } = requestTexts(fetchMock);
    expect(system).toContain("AFTER submission");
    expect(system).toContain("Student selected: Three");
    expect(system).toContain("Correct option: Four");
    expect(system).toContain("SECRET_EXPLANATION_TEXT");
    expect(user).toContain("Why was I wrong?");
  });
});

describe("AI cannot mutate SkillForge state", () => {
  it("awards no XP and changes no progress", async () => {
    const userId = await createUser();
    const skillId = await createSkill();
    const lessonId = await createLesson(skillId);

    const xpBefore = await prisma.xpEvent.count({ where: { userId } });
    const progressBefore = await prisma.lessonProgress.count({ where: { userId } });

    const result = await ask({ mode: "ASK", question: "teach me", lessonId, skillId }, userId);
    expect(result.ok).toBe(true);

    const xpAfter = await prisma.xpEvent.count({ where: { userId } });
    const progressAfter = await prisma.lessonProgress.count({ where: { userId } });
    const streak = await prisma.user.findUnique({ where: { id: userId }, select: { currentStreak: true } });
    expect(xpAfter).toBe(xpBefore);
    expect(progressAfter).toBe(progressBefore);
    expect(streak!.currentStreak).toBe(0);
  });

  it("oversized input never reaches the provider", async () => {
    const userId = await createUser();
    const result = await ask({ mode: "ASK", question: "x".repeat(2001) }, userId);
    expect(result.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("setAiPreference", () => {
  it("rejects a signed-out user", async () => {
    const res = await setAiPreference(false);
    expect(res.error).toBe("Not signed in");
  });

  it("updates the user's AI preference", async () => {
    const userId = await createUser({ aiEnabled: true });
    authMock.mockResolvedValue({ user: { id: userId, username: "u" } } as never);
    const res = await setAiPreference(false);
    expect(res.error).toBeUndefined();
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { aiEnabled: true } });
    expect(user!.aiEnabled).toBe(false);
  });
});

describe("askTutor action", () => {
  it("routes a signed-in user's question through the tutor", async () => {
    const userId = await createUser();
    authMock.mockResolvedValue({ user: { id: userId, username: "u" } } as never);
    const res = await askTutor({ mode: "HINT", question: "hint me" });
    expect(res.error).toBeUndefined();
    expect(res.result?.reply).toBe("Here is a nudge, not the answer.");
    expect(res.result?.conversationId).toBeTruthy();
    if (res.result) conversationIds.push(res.result.conversationId);
  });
});
