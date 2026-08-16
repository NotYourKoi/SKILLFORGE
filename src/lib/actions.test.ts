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

import { AuthError } from "next-auth";
import { auth, signIn } from "@/auth";
import { prisma } from "./db";
import {
  completeLesson,
  login,
  register,
  runExercise,
  submitExercise,
  submitQuiz,
  toggleSkill,
} from "./actions";

const authMock = vi.mocked(auth);
const signInMock = vi.mocked(signIn);

let userId: string | null = null;
const skillIds: string[] = [];
const quizIds: string[] = [];
const lessonIds: string[] = [];

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

async function cleanup(): Promise<void> {
  if (userId) {
    await prisma.quizAttempt.deleteMany({ where: { userId } });
    await prisma.lessonProgress.deleteMany({ where: { userId } });
    await prisma.userSkill.deleteMany({ where: { userId } });
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
  for (const id of skillIds) {
    await prisma.skill.delete({ where: { id } }).catch(() => {});
  }
  skillIds.length = 0;
}

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue(null as never);
  signInMock.mockResolvedValue({} as never);
});

afterEach(async () => {
  await cleanup();
});

describe("authentication guards", () => {
  it("toggleSkill rejects an anonymous user", async () => {
    expect(await toggleSkill("ANY")).toEqual({ error: "Not signed in" });
  });

  it("completeLesson rejects an anonymous user", async () => {
    expect(await completeLesson("ANY", "ANY")).toEqual({ error: "Not signed in" });
  });

  it("submitQuiz rejects an anonymous user", async () => {
    expect(await submitQuiz("ANY", "ANY", {})).toEqual({ error: "Not signed in" });
  });

  it("runExercise rejects an anonymous user", async () => {
    expect(await runExercise("ANY", "print(1)")).toEqual({ error: "Not signed in" });
  });

  it("submitExercise rejects an anonymous user", async () => {
    expect(await submitExercise("ANY", "print(1)")).toEqual({ error: "Not signed in" });
  });
});

describe("register / login actions", () => {
  it("creates the user, hashes the password and signs in", async () => {
    const suffix = uid("reg");
    const form = new FormData();
    form.set("username", suffix);
    form.set("email", `${suffix}@test.local`);
    form.set("password", "correct-horse-battery");

    const result = await register({}, form);
    expect(result).toEqual({});

    const user = await prisma.user.findUnique({ where: { username: suffix } });
    expect(user).not.toBeNull();
    expect(user!.passwordHash).not.toBe("correct-horse-battery");
    expect(signInMock).toHaveBeenCalledWith("credentials", {
      identifier: suffix,
      password: "correct-horse-battery",
      redirectTo: "/dashboard",
    });

    await prisma.user.delete({ where: { id: user!.id } }).catch(() => {});
  });

  it("rejects a duplicate username or email", async () => {
    const suffix = uid("dup");
    const form = new FormData();
    form.set("username", suffix);
    form.set("email", `${suffix}@test.local`);
    form.set("password", "correct-horse-battery");

    await register({}, form);
    const duplicate = new FormData();
    duplicate.set("username", suffix);
    duplicate.set("email", "different@test.local");
    duplicate.set("password", "correct-horse-battery");

    const result = await register({}, duplicate);
    expect(result.error).toMatch(/already exists/i);
  });

  it("returns an error for invalid registration input", async () => {
    const form = new FormData();
    form.set("username", "ab");
    form.set("email", "bad");
    form.set("password", "x");

    const result = await register({}, form);
    expect(result.error).toBeTruthy();
    expect(signInMock).not.toHaveBeenCalled();
  });

  it("login signs in with the right credentials", async () => {
    const result = await login({}, formWith("ganesh", "pw123"));
    expect(result).toEqual({});
    expect(signInMock).toHaveBeenCalledWith("credentials", {
      identifier: "ganesh",
      password: "pw123",
      redirectTo: "/dashboard",
    });
  });

  it("login reports invalid credentials", async () => {
    signInMock.mockRejectedValue(new AuthError("CredentialsSignin"));
    const result = await login({}, formWith("nobody", "nope"));
    expect(result.error).toMatch(/Invalid/i);
  });
});

describe("lesson progress", () => {
  it("marks a lesson complete and toggles it back off", async () => {
    userId = await createUser();
    authMock.mockResolvedValue({ user: { id: userId! } } as never);
    await createSkill("A_LESSON_ACTION");

    const lesson = await prisma.lesson.create({
      data: { skillId: "A_LESSON_ACTION", title: "L", content: "c", order: 0 },
    });
    lessonIds.push(lesson.id);

    await completeLesson(lesson.id, "A_LESSON_ACTION");
    let row = await prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId: userId!, lessonId: lesson.id } },
    });
    expect(row?.completed).toBe(true);
    expect(row?.completedAt).not.toBeNull();

    await completeLesson(lesson.id, "A_LESSON_ACTION");
    row = await prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId: userId!, lessonId: lesson.id } },
    });
    expect(row?.completed).toBe(false);
  });
});

describe("submitQuiz", () => {
  async function createQuizFixture(passScore = 70): Promise<{ quizId: string }> {
    await createSkill("A_QUIZ_ACTION");
    const quiz = await prisma.quiz.create({
      data: {
        skillId: "A_QUIZ_ACTION",
        title: "Quiz",
        passScore,
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
            {
              prompt: "q2",
              order: 1,
              options: {
                create: [
                  { text: "right", isCorrect: true, order: 0 },
                  { text: "wrong", isCorrect: false, order: 1 },
                ],
              },
            },
          ],
        },
      },
      include: { questions: { include: { options: true } } },
    });
    quizIds.push(quiz.id);
    return { quizId: quiz.id };
  }

  it("grades a perfect attempt and persists it", async () => {
    userId = await createUser();
    authMock.mockResolvedValue({ user: { id: userId! } } as never);
    const { quizId } = await createQuizFixture();

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: { include: { options: true } } },
    });
    const selected: Record<string, string> = {};
    for (const question of quiz!.questions) {
      selected[question.id] = question.options.find((o) => o.isCorrect)!.id;
    }

    const result = await submitQuiz(quizId, "A_QUIZ_ACTION", selected);
    expect(result.result?.score).toBe(100);
    expect(result.result?.passed).toBe(true);

    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: result.result!.attemptId },
      include: { answers: true },
    });
    expect(attempt).not.toBeNull();
    expect(attempt!.passed).toBe(true);
    expect(attempt!.answers).toHaveLength(2);
  });

  it("persists a failing attempt below the pass score", async () => {
    userId = await createUser();
    authMock.mockResolvedValue({ user: { id: userId! } } as never);
    const { quizId } = await createQuizFixture(100);

    const result = await submitQuiz(quizId, "A_QUIZ_ACTION", {});
    expect(result.result?.score).toBe(0);
    expect(result.result?.passed).toBe(false);

    const attempts = await prisma.quizAttempt.findMany({ where: { userId: userId! } });
    expect(attempts).toHaveLength(1);
    expect(attempts[0].passed).toBe(false);
  });

  it("returns an error for an unknown quiz", async () => {
    userId = await createUser();
    authMock.mockResolvedValue({ user: { id: userId! } } as never);
    const result = await submitQuiz("DOES_NOT_EXIST", "A_QUIZ_ACTION", {});
    expect(result.error).toBe("Quiz not found");
  });
});

describe("submitExercise action", () => {
  it("records an unavailable attempt through the local mock provider", async () => {
    userId = await createUser();
    authMock.mockResolvedValue({ user: { id: userId! } } as never);
    await createSkill("A_EX_ACTION");
    const exercise = await prisma.exercise.create({
      data: {
        id: "A_EX_ACTION_EX",
        skillId: "A_EX_ACTION",
        title: "Ex",
        prompt: "p",
        language: "python",
        order: 0,
        testCases: { create: [{ input: "", expectedOutput: "hi", description: "t", order: 0 }] },
      },
    });

    const result = await submitExercise(exercise.id, "print(\"hi\")");
    expect(result.result?.status).toBe("unavailable");
    expect(result.result?.passed).toBe(false);

    const attempt = await prisma.exerciseAttempt.findUnique({
      where: { id: result.result!.attemptId },
    });
    expect(attempt).not.toBeNull();
    expect(attempt!.status).toBe("unavailable");

    const progress = await prisma.userExerciseProgress.findUnique({
      where: { userId_exerciseId: { userId: userId!, exerciseId: exercise.id } },
    });
    expect(progress).not.toBeNull();
    expect(progress!.attempted).toBe(true);
    expect(progress!.solved).toBe(false);
  });

  it("rejects an unknown exercise", async () => {
    userId = await createUser();
    authMock.mockResolvedValue({ user: { id: userId! } } as never);
    const result = await submitExercise("DOES_NOT_EXIST", "print(1)");
    expect(result.error).toBe("Exercise not found");
  });
});

function formWith(identifier: string, password: string): FormData {
  const form = new FormData();
  form.set("identifier", identifier);
  form.set("password", password);
  return form;
}
