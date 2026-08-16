"use server";

import { revalidatePath } from "next/cache";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { registerSchema, addGoalSchema, goalTextSchema } from "@/lib/validation";
import { signIn, signOut, auth } from "@/auth";
import { toggleSkillCompletion } from "@/lib/queries";
import {
  addUserGoal,
  GoalError,
  removeUserGoal,
  updateGoalText as updateGoalTextRecord,
} from "@/lib/goals";
import { filterValidSelectedAnswers, gradeQuiz } from "@/lib/quiz";
import {
  runExercise as runExerciseCode,
  submitExercise as submitExerciseAttempt,
  type ExerciseSubmissionResult,
} from "@/lib/exercises";
import type { ExecutionResult } from "@/lib/execution";
import { computeProjectProgress, type ProjectProgress } from "@/lib/projects";
import {
  awardCourseCompletionXp,
  awardXp,
  emptyFeedback,
  evaluateAndUnlockAchievements,
  getLiveStreak,
  getStoredStreak,
  updateStreak,
  XP_VALUES,
  type GamificationFeedback,
} from "@/lib/progression";
import { runTutor, type AskTutorInput } from "@/lib/ai/tutor";
import {
  AUTH_RATE_LIMIT_MESSAGE,
  authRateLimitKey,
  authRateLimiter,
} from "@/lib/auth-rate-limit";

export type ActionResult = { error?: string };

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: string }).code === "P2002"
  );
}

export async function register(prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const rateKey = await authRateLimitKey();
  if (rateKey) {
    const rate = authRateLimiter.hit(rateKey);
    if (!rate.allowed) return { error: AUTH_RATE_LIMIT_MESSAGE };
  }

  const parsed = registerSchema.safeParse({
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { username, email, password } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
  });
  if (existing) {
    return { error: "A user with that username or email already exists" };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await prisma.user.create({
      data: { username, email, passwordHash },
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { error: "A user with that username or email already exists" };
    }
    throw error;
  }

  try {
    await signIn("credentials", {
      identifier: username,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Something went wrong signing you in" };
    }
    throw error;
  }

  return {};
}

export async function login(prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const rateKey = await authRateLimitKey();
  if (rateKey) {
    const rate = authRateLimiter.hit(rateKey);
    if (!rate.allowed) return { error: AUTH_RATE_LIMIT_MESSAGE };
  }

  try {
    await signIn("credentials", {
      identifier: formData.get("identifier"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid username/email or password" };
        default:
          return { error: "Something went wrong signing you in" };
      }
    }
    throw error;
  }
  return {};
}

export async function logout() {
  await signOut({ redirectTo: "/" });
}

export async function toggleSkill(
  skillId: string,
): Promise<ActionResult & { result?: { completed: boolean; feedback: GamificationFeedback } }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not signed in" };

  const wasCompleted = !!(await prisma.userSkill.findUnique({
    where: { userId_skillId: { userId: session.user.id, skillId } },
    select: { completed: true },
  }))?.completed;

  const result = await toggleSkillCompletion(session.user.id, skillId);
  if (!result.ok) return { error: result.error };

  const feedback = emptyFeedback();
  if (!wasCompleted) {
    const streakState = await updateStreak(session.user.id);
    const newlyCompletedCourses = await awardCourseCompletionXp(session.user.id);
    feedback.xp = newlyCompletedCourses.length * XP_VALUES.COURSE_COMPLETED;
    feedback.streak = getLiveStreak(streakState).currentStreak;
    const { unlocked } = await evaluateAndUnlockAchievements(session.user.id);
    feedback.unlocked = unlocked;
  }

  revalidatePath("/roadmap");
  revalidatePath("/dashboard");
  revalidatePath(`/skill/${skillId}`);
  return { result: { completed: !wasCompleted, feedback } };
}

export async function completeLesson(
  lessonId: string,
  skillId: string,
): Promise<ActionResult & { result?: { completed: boolean; feedback: GamificationFeedback } }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not signed in" };

  const existing = await prisma.lessonProgress.findUnique({
    where: { userId_lessonId: { userId: session.user.id, lessonId } },
  });

  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: session.user.id, lessonId } },
    create: { userId: session.user.id, lessonId, completed: !existing?.completed, completedAt: existing?.completed ? null : new Date() },
    update: { completed: !existing?.completed, completedAt: existing?.completed ? null : new Date() },
  });

  const completing = !existing?.completed;
  const feedback = emptyFeedback();
  if (completing) {
    const award = await awardXp(session.user.id, "LESSON_COMPLETED", lessonId);
    const streakState = await updateStreak(session.user.id);
    const { unlocked } = await evaluateAndUnlockAchievements(session.user.id);
    feedback.xp = award.amount;
    feedback.streak = getLiveStreak(streakState).currentStreak;
    feedback.unlocked = unlocked;
  }

  revalidatePath(`/skill/${skillId}/lesson/${lessonId}`);
  revalidatePath(`/skill/${skillId}`);
  return { result: { completed: completing, feedback } };
}

export async function submitQuiz(
  quizId: string,
  skillId: string,
  selected: Record<string, string>,
): Promise<ActionResult & { result?: { score: number; passed: boolean; attemptId: string } & GamificationFeedback }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not signed in" };

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: {
        include: { options: { select: { id: true, isCorrect: true } } },
      },
    },
  });
  if (!quiz) return { error: "Quiz not found" };

  const validOptionIds = new Map<string, Set<string>>();
  const correctAnswers = new Map<string, string>();
  for (const question of quiz.questions) {
    validOptionIds.set(question.id, new Set(question.options.map((o) => o.id)));
    const correctOption = question.options.find((o) => o.isCorrect);
    if (correctOption) correctAnswers.set(question.id, correctOption.id);
  }

  // `selected` is client-controlled: drop any option id that does not belong
  // to its question so stored answers are always consistent and grading only
  // sees valid choices.
  const validSelected = filterValidSelectedAnswers(validOptionIds, selected);

  const result = gradeQuiz(correctAnswers, validSelected, quiz.passScore);

  const attempt = await prisma.quizAttempt.create({
    data: {
      userId: session.user.id,
      quizId,
      score: result.score,
      passed: result.passed,
      answers: {
        create: quiz.questions.flatMap((question) => {
          const optionId = validSelected[question.id];
          if (!optionId) return [];
          return [{ questionId: question.id, optionId }];
        }),
      },
    },
  });

  const feedback = emptyFeedback();
  if (result.passed) {
    const award = await awardXp(session.user.id, "QUIZ_PASSED", quizId);
    const streakState = award.awarded ? await updateStreak(session.user.id) : await getStoredStreak(session.user.id);
    const { unlocked } = await evaluateAndUnlockAchievements(session.user.id);
    feedback.xp = award.amount;
    feedback.streak = getLiveStreak(streakState).currentStreak;
    feedback.unlocked = unlocked;
  }

  revalidatePath(`/skill/${skillId}/quiz/${quizId}`);
  revalidatePath(`/dashboard`);
  return {
    result: {
      score: result.score,
      passed: result.passed,
      attemptId: attempt.id,
      ...feedback,
    },
  };
}

/**
 * Runs learner code through the execution provider. Never executes code
 * locally (see src/lib/execution). No attempt is recorded for a dry run.
 */
export async function runExercise(
  exerciseId: string,
  code: string,
): Promise<ActionResult & { result?: ExecutionResult }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not signed in" };

  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    select: { id: true, language: true },
  });
  if (!exercise) return { error: "Exercise not found" };

  return runExerciseCode(code, exercise.language);
}

/**
 * Submits learner code for grading. The attempt and progress are recorded,
 * then the relevant routes are revalidated.
 */
export async function submitExercise(
  exerciseId: string,
  code: string,
): Promise<ActionResult & { result?: ExerciseSubmissionResult & GamificationFeedback }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not signed in" };

  const result = await submitExerciseAttempt(exerciseId, session.user.id, code);
  if (result.error) return { error: result.error };
  const submission = result.result;
  if (!submission) return { error: "Submission failed" };

  const feedback = emptyFeedback();
  if (submission.passed) {
    const award = await awardXp(session.user.id, "EXERCISE_SOLVED", exerciseId);
    const streakState = award.awarded ? await updateStreak(session.user.id) : await getStoredStreak(session.user.id);
    const { unlocked } = await evaluateAndUnlockAchievements(session.user.id);
    feedback.xp = award.amount;
    feedback.streak = getLiveStreak(streakState).currentStreak;
    feedback.unlocked = unlocked;
  }

  revalidatePath(`/exercise/${exerciseId}`);
  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    select: { skillId: true },
  });
  if (exercise) {
    revalidatePath(`/skill/${exercise.skillId}`);
  }
  return { result: { ...submission, ...feedback } };
}

const MAX_PROJECT_NOTES_LENGTH = 5000;

function parseMilestoneTitles(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

async function revalidateProjectRoutes(projectId: string): Promise<void> {
  revalidatePath("/projects");
  revalidatePath(`/project/${projectId}`);
  revalidatePath("/dashboard");
  revalidatePath("/progress");
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { skillId: true },
  });
  if (project) revalidatePath(`/skill/${project.skillId}`);
}

/** Starts a project (idempotent): creates the UserProject row with startedAt. */
export async function startProject(
  projectId: string,
): Promise<ActionResult & { result?: { started: boolean } }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not signed in" };

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  });
  if (!project) return { error: "Project not found" };

  const existing = await prisma.userProject.findUnique({
    where: { userId_projectId: { userId: session.user.id, projectId } },
  });
  let started = false;
  if (!existing) {
    await prisma.userProject.create({
      data: { userId: session.user.id, projectId, startedAt: new Date() },
    });
    started = true;
  }

  await revalidateProjectRoutes(projectId);
  return { result: { started } };
}

/**
 * Toggles one milestone for the user. Completing the final milestone marks the
 * project complete (with a timestamp); un-checking a milestone reopens it.
 */
export async function toggleProjectMilestone(
  projectId: string,
  milestoneIndex: number,
): Promise<
  ActionResult & {
    result?: {
      milestoneIndex: number;
      completed: boolean;
      projectCompleted: boolean;
      progress: ProjectProgress;
    } & GamificationFeedback;
  }
> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not signed in" };

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, milestones: true },
  });
  if (!project) return { error: "Project not found" };

  const milestones = parseMilestoneTitles(project.milestones);
  if (milestoneIndex < 0 || milestoneIndex >= milestones.length) {
    return { error: "Invalid milestone" };
  }

  const userId = session.user.id;
  const existing = await prisma.userProject.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });
  if (!existing) {
    await prisma.userProject.create({
      data: { userId, projectId, startedAt: new Date() },
    });
  }

  const record = await prisma.projectMilestoneProgress.findUnique({
    where: {
      userId_projectId_milestoneIndex: { userId, projectId, milestoneIndex },
    },
  });

  let completed: boolean;
  if (record) {
    await prisma.projectMilestoneProgress.delete({
      where: {
        userId_projectId_milestoneIndex: { userId, projectId, milestoneIndex },
      },
    });
    completed = false;
  } else {
    try {
      await prisma.projectMilestoneProgress.create({
        data: { userId, projectId, milestoneIndex, completedAt: new Date() },
      });
    } catch (error) {
      // Concurrent double-toggle: the row already exists, treat as completed.
      if (!isUniqueViolation(error)) throw error;
    }
    completed = true;
  }

  const doneCount = await prisma.projectMilestoneProgress.count({
    where: { userId, projectId },
  });
  const progress = computeProjectProgress(milestones.length, doneCount);
  const projectCompleted = progress.done;

  const userProject = await prisma.userProject.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });

  const feedback = emptyFeedback();
  if (projectCompleted && !userProject?.completed) {
    await prisma.userProject.update({
      where: { userId_projectId: { userId, projectId } },
      data: { completed: true, completedAt: new Date() },
    });
  } else if (!projectCompleted && userProject?.completed) {
    await prisma.userProject.update({
      where: { userId_projectId: { userId, projectId } },
      data: { completed: false, completedAt: null },
    });
  }

  if (completed) {
    const milestoneAward = await awardXp(
      userId,
      "PROJECT_MILESTONE",
      `${projectId}:${milestoneIndex}`,
    );
    const streakState = await updateStreak(userId);
    feedback.xp = milestoneAward.amount;
    feedback.streak = getLiveStreak(streakState).currentStreak;
  }
  if (projectCompleted) {
    const projectAward = await awardXp(userId, "PROJECT_COMPLETED", projectId);
    feedback.xp += projectAward.amount;
  }
  if (feedback.xp > 0 || feedback.streak > 0 || completed) {
    const { unlocked } = await evaluateAndUnlockAchievements(userId);
    feedback.unlocked = unlocked;
  }

  await revalidateProjectRoutes(projectId);
  return {
    result: {
      milestoneIndex,
      completed,
      projectCompleted,
      progress,
      ...feedback,
    },
  };
}

/**
 * Manually toggles project completion (useful for projects without milestones,
 * or as an override). Completing via milestones also sets this flag.
 */
export async function toggleProjectCompletion(
  projectId: string,
): Promise<
  ActionResult & {
    result?: { completed: boolean; completedAt: Date | null } & GamificationFeedback;
  }
> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not signed in" };

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  });
  if (!project) return { error: "Project not found" };

  const userId = session.user.id;
  const existing = await prisma.userProject.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });
  const nextCompleted = !existing?.completed;
  const row = existing
    ? await prisma.userProject.update({
        where: { userId_projectId: { userId, projectId } },
        data: {
          startedAt: existing.startedAt ?? new Date(),
          completed: nextCompleted,
          completedAt: nextCompleted ? new Date() : null,
        },
      })
    : await prisma.userProject.create({
        data: {
          userId,
          projectId,
          startedAt: new Date(),
          completed: nextCompleted,
          completedAt: nextCompleted ? new Date() : null,
        },
      });

  const feedback = emptyFeedback();
  if (nextCompleted) {
    const award = await awardXp(userId, "PROJECT_COMPLETED", projectId);
    const streakState = await updateStreak(userId);
    const { unlocked } = await evaluateAndUnlockAchievements(userId);
    feedback.xp = award.amount;
    feedback.streak = getLiveStreak(streakState).currentStreak;
    feedback.unlocked = unlocked;
  }

  await revalidateProjectRoutes(projectId);
  return {
    result: { completed: row.completed, completedAt: row.completedAt, ...feedback },
  };
}

/** Saves a learner's private notes for a project (never shown to others). */
export async function saveProjectNotes(
  projectId: string,
  notes: string,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not signed in" };

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  });
  if (!project) return { error: "Project not found" };

  const trimmed = notes.slice(0, MAX_PROJECT_NOTES_LENGTH);
  await prisma.userProject.upsert({
    where: { userId_projectId: { userId: session.user.id, projectId } },
    update: { notes: trimmed },
    create: { userId: session.user.id, projectId, startedAt: new Date(), notes: trimmed },
  });

  revalidatePath(`/project/${projectId}`);
  return {};
}

/**
 * AI Tutor entry point. Only ever runs when the student explicitly asks;
 * never during page loads or rendering.
 */
export async function askTutor(
  input: AskTutorInput,
): Promise<ActionResult & { result?: { reply: string; conversationId: string } }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not signed in" };

  const outcome = await runTutor(session.user.id, input);
  if (!outcome.ok) return { error: outcome.error };
  return { result: outcome.data };
}

/** Lightweight AI preference: ON / OFF. */
export async function setAiPreference(enabled: boolean): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not signed in" };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { aiEnabled: Boolean(enabled) },
  });
  return {};
}

const GOAL_REVALIDATE_PATHS = ["/profile", "/dashboard", "/explore", "/courses"];

async function revalidateGoalRoutes(courseSlug: string | null): Promise<void> {
  for (const path of GOAL_REVALIDATE_PATHS) revalidatePath(path);
  if (courseSlug) revalidatePath(`/course/${courseSlug}`);
}

/** Sets a course as an active goal (max 3). */
export async function addGoal(
  prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult & { result?: { id: string; courseSlug: string | null } }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not signed in" };

  const parsed = addGoalSchema.safeParse({
    courseId: formData.get("courseId"),
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const goal = await addUserGoal(session.user.id, parsed.data.courseId, parsed.data.note);
    await revalidateGoalRoutes(goal.courseSlug);
    return { result: { id: goal.id, courseSlug: goal.courseSlug } };
  } catch (error) {
    if (error instanceof GoalError) return { error: error.message };
    throw error;
  }
}

/** Renames a goal's label. */
export async function updateGoalText(
  prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult & { result?: { id: string; courseSlug: string | null } }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not signed in" };

  const parsed = goalTextSchema.safeParse({
    goalId: formData.get("goalId"),
    text: formData.get("text"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const goal = await updateGoalTextRecord(session.user.id, parsed.data.goalId, parsed.data.text);
    await revalidateGoalRoutes(goal.courseSlug);
    return { result: { id: goal.id, courseSlug: goal.courseSlug } };
  } catch (error) {
    if (error instanceof GoalError) return { error: error.message };
    throw error;
  }
}

/** Removes (soft-deactivates) a goal. */
export async function removeGoal(
  goalId: string,
): Promise<ActionResult & { result?: { id: string; courseSlug: string | null } }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not signed in" };

  try {
    const id = await removeUserGoal(session.user.id, goalId);
    revalidatePath("/profile");
    revalidatePath("/dashboard");
    revalidatePath("/explore");
    return { result: { id, courseSlug: null } };
  } catch (error) {
    if (error instanceof GoalError) return { error: error.message };
    throw error;
  }
}
