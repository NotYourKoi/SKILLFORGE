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
import { prisma } from "./db";
import {
  completeLesson,
  submitExercise,
  submitQuiz,
  toggleProjectCompletion,
  toggleProjectMilestone,
  toggleSkill,
} from "./actions";
import {
  awardXp,
  computeStreakUpdate,
  dayKey,
  dayKeyToDate,
  getCompletedCourseIds,
  getLiveStreak,
  getProgressOverview,
  getTotalXp,
  levelFromXp,
  updateStreak,
  XP_VALUES,
} from "./progression";
import { submitExercise as submitExerciseAttempt } from "./exercises";
import type { ExerciseSubmissionResult } from "./exercises";

const authMock = vi.mocked(auth);
const submitExerciseMock = vi.mocked(submitExerciseAttempt);

let userId: string | null = null;
const skillIds: string[] = [];
const lessonIds: string[] = [];
const quizIds: string[] = [];
const exerciseIds: string[] = [];
const projectIds: string[] = [];
const courseIds: string[] = [];

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

async function createUser(): Promise<string> {
  const suffix = uid("u");
  const user = await prisma.user.create({
    data: {
      username: suffix,
      email: `${suffix}@test.local`,
      passwordHash: "not-a-real-hash",
    },
  });
  return user.id;
}

async function createSkill(id: string): Promise<void> {
  skillIds.push(id);
  await prisma.skill.create({
    data: { id, name: id, description: `${id} desc`, tier: "Core", x: 0, y: 0 },
  });
}

async function createLesson(skillId: string): Promise<string> {
  const id = uid("l");
  lessonIds.push(id);
  await prisma.lesson.create({
    data: {
      id,
      skillId,
      title: "Lesson",
      description: "desc",
      estimatedMinutes: 10,
      difficulty: "Easy",
      order: 0,
      content: "[]",
      checkpoints: "[]",
    },
  });
  return id;
}

async function createQuiz(skillId: string): Promise<{ id: string; selected: Record<string, string> }> {
  const quiz = await prisma.quiz.create({
    data: {
      skillId,
      title: "Quiz",
      passScore: 70,
      questions: {
        create: [
          {
            prompt: "q1",
            order: 0,
            options: {
              create: [
                { text: "wrong", isCorrect: false, order: 0 },
                { text: "right", isCorrect: true, order: 1 },
              ],
            },
          },
        ],
      },
    },
    include: { questions: { include: { options: true } } },
  });
  quizIds.push(quiz.id);
  const selected: Record<string, string> = {};
  for (const question of quiz.questions) {
    selected[question.id] = question.options.find((o) => o.isCorrect)!.id;
  }
  return { id: quiz.id, selected };
}

async function createExercise(skillId: string): Promise<string> {
  const id = uid("e");
  exerciseIds.push(id);
  await prisma.exercise.create({
    data: {
      id,
      skillId,
      title: "Exercise",
      prompt: "prompt",
      language: "python",
      order: 0,
    },
  });
  return id;
}

async function createProject(skillId: string): Promise<string> {
  const id = uid("p");
  projectIds.push(id);
  await prisma.project.create({
    data: {
      id,
      skillId,
      title: "Project",
      description: "desc",
      category: "Practice",
      difficulty: "Beginner",
      estimatedMinutes: 45,
      order: 0,
      objectives: "[]",
      requirements: "[]",
      hints: "[]",
      milestones: JSON.stringify(["M1", "M2"]),
      expectedOutput: "",
    },
  });
  return id;
}

async function createCourse(skillIdsToConnect: string[]): Promise<string> {
  const id = uid("c");
  courseIds.push(id);
  await prisma.course.create({
    data: {
      id,
      slug: uid("slug"),
      title: "Course",
      description: "desc",
      category: "Programming",
      difficulty: "Beginner",
      estimatedMinutes: 30,
      objectives: "[]",
      modules: {
        create: [
          {
            id: uid("m"),
            title: "Module",
            description: "desc",
            order: 0,
            objectives: "[]",
            skills: { connect: skillIdsToConnect.map((skillId) => ({ id: skillId })) },
          },
        ],
      },
    },
  });
  return id;
}

async function cleanup(): Promise<void> {
  if (userId) {
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    userId = null;
  }
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
  for (const id of projectIds) {
    await prisma.project.delete({ where: { id } }).catch(() => {});
  }
  projectIds.length = 0;
  for (const id of courseIds) {
    await prisma.course.delete({ where: { id } }).catch(() => {});
  }
  courseIds.length = 0;
  for (const id of skillIds) {
    await prisma.skill.delete({ where: { id } }).catch(() => {});
  }
  skillIds.length = 0;
}

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue(null as never);
});

afterEach(async () => {
  await cleanup();
});

describe("level math", () => {
  it("derives level and in-level progress from total XP", () => {
    expect(levelFromXp(0).level).toBe(1);
    expect(levelFromXp(499).level).toBe(1);
    expect(levelFromXp(499).intoLevel).toBe(499);
    expect(levelFromXp(500).level).toBe(2);
    expect(levelFromXp(500).intoLevel).toBe(0);
    expect(levelFromXp(1250).level).toBe(3);
    expect(levelFromXp(1250).intoLevel).toBe(250);
    expect(levelFromXp(1250).percent).toBe(50);
    expect(levelFromXp(1250).xpToNext).toBe(250);
    expect(levelFromXp(-5).level).toBe(1);
  });
});

describe("streak math (pure)", () => {
  const start = dayKeyToDate(dayKey(new Date("2026-08-14T10:00:00.000Z")));
  const nextDay = dayKeyToDate(dayKey(new Date("2026-08-15T10:00:00.000Z")));

  it("starts a streak on first activity", () => {
    const state = computeStreakUpdate(
      { currentStreak: 0, longestStreak: 0, lastActiveDate: null },
      start,
    );
    expect(state).toEqual({
      currentStreak: 1,
      longestStreak: 1,
      lastActiveDate: start,
    });
  });

  it("ignores same-day activity", () => {
    const state = computeStreakUpdate(
      { currentStreak: 3, longestStreak: 5, lastActiveDate: start },
      new Date("2026-08-14T23:00:00.000Z"),
    );
    expect(state.currentStreak).toBe(3);
  });

  it("extends a streak on consecutive days", () => {
    const state = computeStreakUpdate(
      { currentStreak: 3, longestStreak: 5, lastActiveDate: start },
      nextDay,
    );
    expect(state.currentStreak).toBe(4);
    expect(state.longestStreak).toBe(5);
  });

  it("resets the streak after a gap of two or more days but keeps the longest", () => {
    const gapDay = dayKeyToDate(dayKey(new Date("2026-08-20T10:00:00.000Z")));
    const state = computeStreakUpdate(
      { currentStreak: 3, longestStreak: 5, lastActiveDate: start },
      gapDay,
    );
    expect(state.currentStreak).toBe(1);
    expect(state.longestStreak).toBe(5);
  });

  it("updates the longest streak when it is beaten", () => {
    const state = computeStreakUpdate(
      { currentStreak: 5, longestStreak: 5, lastActiveDate: start },
      nextDay,
    );
    expect(state.currentStreak).toBe(6);
    expect(state.longestStreak).toBe(6);
  });

  it("reports a broken live streak when the last activity is not today or yesterday", () => {
    const stored = {
      currentStreak: 3,
      longestStreak: 3,
      lastActiveDate: new Date("2026-08-10T10:00:00.000Z"),
    };
    expect(getLiveStreak(stored, new Date("2026-08-14T10:00:00.000Z")).currentStreak).toBe(0);
    const fresh = { ...stored, lastActiveDate: new Date("2026-08-14T09:00:00.000Z") };
    expect(getLiveStreak(fresh, new Date("2026-08-14T10:00:00.000Z")).currentStreak).toBe(3);
    const yesterday = { ...stored, lastActiveDate: new Date("2026-08-13T09:00:00.000Z") };
    expect(getLiveStreak(yesterday, new Date("2026-08-14T10:00:00.000Z")).currentStreak).toBe(3);
  });
});

describe("xp service", () => {
  it("awards XP once and is idempotent for the same (user, reason, reference)", async () => {
    userId = await createUser();
    const first = await awardXp(userId, "LESSON_COMPLETED", "lesson-1");
    expect(first).toEqual({ awarded: true, amount: XP_VALUES.LESSON_COMPLETED });

    const second = await awardXp(userId, "LESSON_COMPLETED", "lesson-1");
    expect(second).toEqual({ awarded: false, amount: 0 });

    expect(await getTotalXp(userId)).toBe(XP_VALUES.LESSON_COMPLETED);
    const events = await prisma.xpEvent.count({ where: { userId } });
    expect(events).toBe(1);
  });

  it("allows the same reason with different references", async () => {
    userId = await createUser();
    await awardXp(userId, "LESSON_COMPLETED", "lesson-1");
    await awardXp(userId, "LESSON_COMPLETED", "lesson-2");
    expect(await getTotalXp(userId)).toBe(XP_VALUES.LESSON_COMPLETED * 2);
  });
});

describe("streak persistence", () => {
  it("persists the streak update and longest record", async () => {
    userId = await createUser();
    const dayOne = new Date("2026-08-14T10:00:00.000Z");
    const dayTwo = new Date("2026-08-15T10:00:00.000Z");

    const first = await updateStreak(userId, dayOne);
    expect(first.currentStreak).toBe(1);

    const second = await updateStreak(userId, dayTwo);
    expect(second.currentStreak).toBe(2);
    expect(second.longestStreak).toBe(2);

    const broken = await updateStreak(userId, new Date("2026-08-20T10:00:00.000Z"));
    expect(broken.currentStreak).toBe(1);
    expect(broken.longestStreak).toBe(2);
  });
});

describe("lesson completion gamification", () => {
  it("awards XP, extends the streak and unlocks the first-lesson achievement", async () => {
    userId = await createUser();
    authMock.mockResolvedValue({ user: { id: userId } } as never);
    await createSkill("GAM_LESSON");
    const lessonId = await createLesson("GAM_LESSON");

    const res = await completeLesson(lessonId, "GAM_LESSON");
    expect(res.result?.feedback.xp).toBe(XP_VALUES.LESSON_COMPLETED);
    expect(res.result?.feedback.streak).toBe(1);
    expect(res.result?.feedback.unlocked.map((a) => a.id)).toContain("ACH_FIRST_LESSON");
    expect(await getTotalXp(userId)).toBe(
      XP_VALUES.LESSON_COMPLETED + 10, // + first-lesson achievement reward
    );

    const user = await prisma.user.findUnique({ where: { id: userId } });
    expect(user?.currentStreak).toBe(1);
    expect(user?.lastActiveDate).not.toBeNull();
  });

  it("does not re-award XP when a completed lesson is unmarked and re-marked", async () => {
    userId = await createUser();
    authMock.mockResolvedValue({ user: { id: userId } } as never);
    await createSkill("GAM_LESSON2");
    const lessonId = await createLesson("GAM_LESSON2");

    await completeLesson(lessonId, "GAM_LESSON2");
    const unmark = await completeLesson(lessonId, "GAM_LESSON2");
    expect(unmark.result?.feedback.xp).toBe(0);

    const redo = await completeLesson(lessonId, "GAM_LESSON2");
    expect(redo.result?.feedback.xp).toBe(0);
    const lessonEvents = await prisma.xpEvent.count({
      where: { userId, reason: "LESSON_COMPLETED" },
    });
    expect(lessonEvents).toBe(1);
  });

  it("unlocks the 10-lesson achievement after completing ten lessons", async () => {
    userId = await createUser();
    authMock.mockResolvedValue({ user: { id: userId } } as never);
    await createSkill("GAM_LESSON10");

    const ids: string[] = [];
    for (let i = 0; i < 10; i += 1) {
      ids.push(await createLesson("GAM_LESSON10"));
    }
    for (const id of ids) {
      await completeLesson(id, "GAM_LESSON10");
    }

    const achievements = await prisma.userAchievement.findMany({
      where: { userId },
    });
    const unlocked = achievements.map((row) => row.achievementId);
    expect(unlocked).toContain("ACH_10_LESSONS");

    const lessonCount = await prisma.lessonProgress.count({
      where: { userId, completed: true },
    });
    expect(lessonCount).toBe(10);
  });
});

describe("quiz gamification", () => {
  it("awards XP on a passing attempt but not on a failing one", async () => {
    userId = await createUser();
    authMock.mockResolvedValue({ user: { id: userId } } as never);
    await createSkill("GAM_QUIZ");
    const { id, selected } = await createQuiz("GAM_QUIZ");

    const passed = await submitQuiz(id, "GAM_QUIZ", selected);
    expect(passed.result?.passed).toBe(true);
    expect(passed.result?.xp).toBe(XP_VALUES.QUIZ_PASSED);
    expect(passed.result?.unlocked.map((a) => a.id)).toContain("ACH_FIRST_QUIZ");

    const failing = await submitQuiz(id, "GAM_QUIZ", {});
    expect(failing.result?.passed).toBe(false);
    expect(failing.result?.xp).toBe(0);
  });

  it("awards quiz XP only once even across repeated passes", async () => {
    userId = await createUser();
    authMock.mockResolvedValue({ user: { id: userId } } as never);
    await createSkill("GAM_QUIZ2");
    const { id, selected } = await createQuiz("GAM_QUIZ2");

    await submitQuiz(id, "GAM_QUIZ2", selected);
    const again = await submitQuiz(id, "GAM_QUIZ2", selected);
    expect(again.result?.passed).toBe(true);
    expect(again.result?.xp).toBe(0);

    const quizEvents = await prisma.xpEvent.count({
      where: { userId, reason: "QUIZ_PASSED" },
    });
    expect(quizEvents).toBe(1);
  });
});

describe("exercise gamification", () => {
  function passingResult(exerciseId: string): ExerciseSubmissionResult {
    return {
      status: "ok",
      passed: true,
      testsPassed: 1,
      testsTotal: 1,
      stdout: "2",
      stderr: "",
      attemptId: `${exerciseId}_attempt`,
      results: [
        { order: 0, name: "T", passed: true, input: "1", expectedOutput: "2", actualOutput: "2" },
      ],
    };
  }

  it("awards XP, streak and the first-exercise achievement when a submission passes", async () => {
    userId = await createUser();
    authMock.mockResolvedValue({ user: { id: userId } } as never);
    await createSkill("GAM_EX");
    const exerciseId = await createExercise("GAM_EX");
    await prisma.userExerciseProgress.create({
      data: { userId, exerciseId, attempted: true, solved: true },
    });
    submitExerciseMock.mockResolvedValue({ result: passingResult(exerciseId) });

    const res = await submitExercise(exerciseId, "print(1)");
    expect(res.result?.passed).toBe(true);
    expect(res.result?.xp).toBe(XP_VALUES.EXERCISE_SOLVED);
    expect(res.result?.unlocked.map((a) => a.id)).toContain("ACH_FIRST_EXERCISE");
  });

  it("does not award XP for a failing submission", async () => {
    userId = await createUser();
    authMock.mockResolvedValue({ user: { id: userId } } as never);
    await createSkill("GAM_EX2");
    const exerciseId = await createExercise("GAM_EX2");
    submitExerciseMock.mockResolvedValue({
      result: {
        ...passingResult(exerciseId),
        passed: false,
        status: "ok",
      },
    });

    const res = await submitExercise(exerciseId, "print(1)");
    expect(res.result?.passed).toBe(false);
    expect(res.result?.xp).toBe(0);
  });
});

describe("course completion", () => {
  it("detects completed courses and awards COURSE_COMPLETED XP once", async () => {
    userId = await createUser();
    authMock.mockResolvedValue({ user: { id: userId } } as never);
    await createSkill("GAM_COURSE_A");
    await createSkill("GAM_COURSE_B");
    const courseId = await createCourse(["GAM_COURSE_A", "GAM_COURSE_B"]);

    await toggleSkill("GAM_COURSE_A");
    expect((await getCompletedCourseIds(userId)).size).toBe(0);

    const completed = await toggleSkill("GAM_COURSE_B");
    expect(completed.result?.feedback.xp).toBe(XP_VALUES.COURSE_COMPLETED);
    expect(await getCompletedCourseIds(userId)).toEqual(new Set([courseId]));

    const courseEvents = await prisma.xpEvent.count({
      where: { userId, reason: "COURSE_COMPLETED" },
    });
    expect(courseEvents).toBe(1);

    await toggleSkill("GAM_COURSE_A");
    await toggleSkill("GAM_COURSE_A");
    const courseEventsAfter = await prisma.xpEvent.count({
      where: { userId, reason: "COURSE_COMPLETED" },
    });
    expect(courseEventsAfter).toBe(1);
  });
});

describe("project gamification", () => {
  it("awards milestone XP, project XP and the first-project achievement", async () => {
    userId = await createUser();
    authMock.mockResolvedValue({ user: { id: userId } } as never);
    await createSkill("GAM_PROJ");
    const projectId = await createProject("GAM_PROJ");

    const first = await toggleProjectMilestone(projectId, 0);
    expect(first.result?.xp).toBe(XP_VALUES.PROJECT_MILESTONE);
    expect(first.result?.streak).toBe(1);

    const last = await toggleProjectMilestone(projectId, 1);
    expect(last.result?.xp).toBe(
      XP_VALUES.PROJECT_MILESTONE + XP_VALUES.PROJECT_COMPLETED,
    );
    expect(last.result?.projectCompleted).toBe(true);
    expect(last.result?.unlocked.map((a) => a.id)).toContain("ACH_FIRST_PROJECT");

    expect(await getTotalXp(userId)).toBe(
      XP_VALUES.PROJECT_MILESTONE * 2 + XP_VALUES.PROJECT_COMPLETED + 25,
    );
  });

  it("awards project XP once when completing and reopening a project", async () => {
    userId = await createUser();
    authMock.mockResolvedValue({ user: { id: userId } } as never);
    await createSkill("GAM_PROJ2");
    const projectId = await createProject("GAM_PROJ2");

    const on = await toggleProjectCompletion(projectId);
    expect(on.result?.xp).toBe(XP_VALUES.PROJECT_COMPLETED);

    const off = await toggleProjectCompletion(projectId);
    expect(off.result?.xp).toBe(0);

    const again = await toggleProjectCompletion(projectId);
    expect(again.result?.xp).toBe(0);

    const projectEvents = await prisma.xpEvent.count({
      where: { userId, reason: "PROJECT_COMPLETED" },
    });
    expect(projectEvents).toBe(1);
  });
});

describe("progress overview", () => {
  it("aggregates XP, level, streak, categories and achievements", async () => {
    userId = await createUser();
    authMock.mockResolvedValue({ user: { id: userId } } as never);
    await createSkill("GAM_OVERVIEW");
    const lessonId = await createLesson("GAM_OVERVIEW");
    await completeLesson(lessonId, "GAM_OVERVIEW");

    const overview = await getProgressOverview(userId);
    expect(overview.level.level).toBe(1);
    expect(overview.streak.currentStreak).toBe(1);
    expect(overview.lessons.completed).toBe(1);
    expect(overview.lessons.total).toBe(1);
    expect(overview.lessons.percent).toBe(100);
    expect(overview.skills.total).toBe(1);
    expect(overview.achievements.some((a) => a.id === "ACH_FIRST_LESSON" && a.unlocked)).toBe(
      true,
    );
    expect(overview.recentAchievements.map((a) => a.id)).toContain("ACH_FIRST_LESSON");
    expect(overview.categories.find((c) => c.label === "Lessons")?.percent).toBe(100);
    expect(overview.todayGoal.title.length).toBeGreaterThan(0);
  });

  it("reports a zeroed streak and empty goal for a brand-new user", async () => {
    userId = await createUser();
    const overview = await getProgressOverview(userId);
    expect(overview.xp.total).toBe(0);
    expect(overview.level.level).toBe(1);
    expect(overview.streak.currentStreak).toBe(0);
    expect(overview.overallPercent).toBe(0);
    expect(overview.continueLearning).toBeNull();
  });
});

describe("auth guards", () => {
  it("rejects anonymous calls to gamified actions", async () => {
    expect((await completeLesson("ANY", "ANY")).error).toBe("Not signed in");
    expect((await submitQuiz("ANY", "ANY", {})).error).toBe("Not signed in");
    expect((await submitExercise("ANY", "print(1)")).error).toBe("Not signed in");
    expect((await toggleSkill("ANY")).error).toBe("Not signed in");
    expect((await toggleProjectMilestone("ANY", 0)).error).toBe("Not signed in");
    expect((await toggleProjectCompletion("ANY")).error).toBe("Not signed in");
  });
});
