import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "./db";
import {
  getExercise,
  getExercisesBySkill,
  runExercise,
  submitExercise,
} from "./exercises";
import { codeValidationError, MAX_CODE_LENGTH } from "./execution/provider";
import { getExecutionProvider, mockExecutionProvider } from "./execution";
import type {
  CodeExecutionProvider,
  ExecutionResult,
  RunRequest,
  SubmitRequest,
} from "./execution/provider";

let userId: string | null = null;
const skillIds: string[] = [];

class FakeProvider implements CodeExecutionProvider {
  readonly name = "fake";
  readonly executesCode = true;
  submitted: SubmitRequest | null = null;
  ran: RunRequest | null = null;
  constructor(private result: ExecutionResult) {}

  run(request: RunRequest): Promise<ExecutionResult> {
    this.ran = request;
    return Promise.resolve(this.result);
  }

  submit(request: SubmitRequest): Promise<ExecutionResult> {
    this.submitted = request;
    return Promise.resolve(this.result);
  }
}

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

async function createExerciseFixture(exerciseId: string, skillId: string) {
  await createSkill(skillId);
  const exercise = await prisma.exercise.create({
    data: {
      id: exerciseId,
      skillId,
      title: "Exercise",
      prompt: "Do the thing",
      description: "A fixture exercise",
      requirements: JSON.stringify(["Requirement A"]),
      examples: JSON.stringify([{ input: "1", output: "2", note: "example" }]),
      constraints: JSON.stringify(["Constraint B"]),
      language: "python",
      starterCode: "# starter\n",
      solution: "print(1)\n",
      hints: JSON.stringify(["Hint one", "Hint two", "Hint three"]),
      difficulty: "Easy",
      order: 1,
      testCases: {
        create: [
          {
            input: "1",
            expectedOutput: "2",
            description: "Public one",
            isPublic: true,
            order: 0,
          },
          {
            input: "3",
            expectedOutput: "4",
            description: "Hidden one",
            isPublic: false,
            order: 1,
          },
        ],
      },
    },
  });
  return exercise;
}

async function cleanup(): Promise<void> {
  if (userId) {
    await prisma.userExerciseProgress.deleteMany({ where: { userId } });
    await prisma.exerciseAttempt.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    userId = null;
  }
  for (const id of skillIds) {
    await prisma.skill.delete({ where: { id } }).catch(() => {});
  }
  skillIds.length = 0;
}

beforeEach(() => {
  userId = null;
});

afterEach(async () => {
  await cleanup();
});

describe("getExercise", () => {
  it("returns the exercise with parsed metadata and hints, but never the solution", async () => {
    userId = await createUser();
    const exercise = await createExerciseFixture("E1", "EX_SKILL_GET");

    const view = await getExercise(exercise.id, userId);
    expect(view).not.toBeNull();
    expect(view!.title).toBe("Exercise");
    expect(view!.requirements).toEqual(["Requirement A"]);
    expect(view!.examples).toEqual([{ input: "1", output: "2", note: "example" }]);
    expect(view!.constraints).toEqual(["Constraint B"]);
    expect(view!.hints).toEqual(["Hint one", "Hint two", "Hint three"]);
    expect(view!.language).toBe("python");
    expect(view!.starterCode).toBe("# starter\n");
    expect(view!.skill.id).toBe("EX_SKILL_GET");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((view as any).solution).toBeUndefined();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((view as any).testCases).toBeUndefined();
  });

  it("returns null for an unknown exercise", async () => {
    userId = await createUser();
    expect(await getExercise("NOPE", userId)).toBeNull();
  });

  it("reports status and last attempt from the user's progress", async () => {
    userId = await createUser();
    const exercise = await createExerciseFixture("E2", "EX_SKILL_STATUS");
    await prisma.userExerciseProgress.create({
      data: { userId, exerciseId: exercise.id, attempted: true, solved: true, attemptCount: 2 },
    });
    await prisma.exerciseAttempt.create({
      data: {
        userId,
        exerciseId: exercise.id,
        language: "python",
        code: "print(1)",
        status: "ok",
        passed: true,
        testsPassed: 2,
        testsTotal: 2,
      },
    });

    const view = await getExercise(exercise.id, userId);
    expect(view!.status).toMatchObject({ attempted: true, solved: true, attemptCount: 2 });
    expect(view!.lastAttempt).toMatchObject({ status: "ok", passed: true, testsPassed: 2, testsTotal: 2 });
  });
});

describe("getExercisesBySkill", () => {
  it("orders exercises by their order field", async () => {
    userId = await createUser();
    await createSkill("EX_SKILL_ORDER");
    const first = await prisma.exercise.create({
      data: {
        id: "E_ORDER_1",
        skillId: "EX_SKILL_ORDER",
        title: "First",
        prompt: "p",
        language: "python",
        order: 0,
      },
    });
    const second = await prisma.exercise.create({
      data: {
        id: "E_ORDER_2",
        skillId: "EX_SKILL_ORDER",
        title: "Second",
        prompt: "p",
        language: "python",
        order: 2,
      },
    });
    await prisma.exercise.create({
      data: {
        id: "E_ORDER_3",
        skillId: "EX_SKILL_ORDER",
        title: "Middle",
        prompt: "p",
        language: "python",
        order: 1,
      },
    });

    const list = await getExercisesBySkill("EX_SKILL_ORDER", userId);
    expect(list.map((e) => e.id)).toEqual([first.id, "E_ORDER_3", second.id]);
    expect(list[0].status).toBeNull();
  });
});

describe("submitExercise", () => {
  it("records a passing attempt and marks the exercise solved", async () => {
    userId = await createUser();
    const exercise = await createExerciseFixture("E_SUB_PASS", "EX_SKILL_SUB");
    const provider = new FakeProvider({
      status: "ok",
      stdout: "",
      stderr: "",
      testResults: [
        { order: 0, name: "Public one", passed: true, input: "1", expectedOutput: "2", actualOutput: "2" },
        { order: 1, name: "Hidden one", passed: true, input: "3", expectedOutput: "4", actualOutput: "4" },
      ],
    });

    const { error, result } = await submitExercise(exercise.id, userId, "print(2)\n", provider);
    expect(error).toBeUndefined();
    expect(result!.passed).toBe(true);
    expect(result!.testsPassed).toBe(2);
    expect(result!.testsTotal).toBe(2);

    const attempt = await prisma.exerciseAttempt.findUnique({ where: { id: result!.attemptId } });
    expect(attempt).not.toBeNull();
    expect(attempt!.passed).toBe(true);
    expect(attempt!.status).toBe("ok");

    const progress = await prisma.userExerciseProgress.findUnique({
      where: { userId_exerciseId: { userId: userId!, exerciseId: exercise.id } },
    });
    expect(progress).not.toBeNull();
    expect(progress!.attempted).toBe(true);
    expect(progress!.solved).toBe(true);
    expect(progress!.attemptCount).toBe(1);
    expect(progress!.solvedAt).not.toBeNull();
  });

  it("passes hidden test cases to the provider but only returns public results", async () => {
    userId = await createUser();
    const exercise = await createExerciseFixture("E_SUB_HIDDEN", "EX_SKILL_HIDDEN");
    const provider = new FakeProvider({
      status: "ok",
      stdout: "",
      stderr: "",
      testResults: [
        { order: 0, name: "Public one", passed: true, input: "1", expectedOutput: "2", actualOutput: "2" },
        { order: 1, name: "Hidden one", passed: false, input: "3", expectedOutput: "4", actualOutput: "9" },
      ],
    });

    const { result } = await submitExercise(exercise.id, userId, "print(2)\n", provider);
    expect(provider.submitted).not.toBeNull();
    expect(provider.submitted!.testCases).toHaveLength(2);
    expect(provider.submitted!.testCases[1].input).toBe("3");
    expect(provider.submitted!.testCases[1].isPublic).toBe(false);

    expect(result!.passed).toBe(false);
    expect(result!.results).toHaveLength(1);
    expect(result!.results[0].order).toBe(0);
    expect(result!.results[0].name).toBe("Public one");
  });

  it("marks a partial submission as attempted but not solved", async () => {
    userId = await createUser();
    const exercise = await createExerciseFixture("E_SUB_PARTIAL", "EX_SKILL_PARTIAL");
    const provider = new FakeProvider({
      status: "ok",
      stdout: "",
      stderr: "",
      testResults: [
        { order: 0, name: "Public one", passed: true, input: "1", expectedOutput: "2", actualOutput: "2" },
        { order: 1, name: "Hidden one", passed: false, input: "3", expectedOutput: "4", actualOutput: "9" },
      ],
    });

    await submitExercise(exercise.id, userId, "print(2)\n", provider);

    const progress = await prisma.userExerciseProgress.findUnique({
      where: { userId_exerciseId: { userId: userId!, exerciseId: exercise.id } },
    });
    expect(progress!.attempted).toBe(true);
    expect(progress!.solved).toBe(false);
    expect(progress!.solvedAt).toBeNull();
    expect(progress!.bestTestsPassed).toBe(1);
  });

  it("records a submission whose execution errored", async () => {
    userId = await createUser();
    const exercise = await createExerciseFixture("E_SUB_ERR", "EX_SKILL_ERR");
    const provider = new FakeProvider({
      status: "error",
      stdout: "",
      stderr: "Traceback (most recent call last)",
      error: "SyntaxError",
    });

    const { result } = await submitExercise(exercise.id, userId, "print(", provider);
    expect(result!.status).toBe("error");
    expect(result!.passed).toBe(false);

    const attempt = await prisma.exerciseAttempt.findUnique({ where: { id: result!.attemptId } });
    expect(attempt!.status).toBe("error");
    expect(attempt!.passed).toBe(false);
  });

  it("returns an error for an unknown exercise without calling the provider", async () => {
    userId = await createUser();
    const provider = new FakeProvider({ status: "ok", stdout: "", stderr: "" });
    const { error, result } = await submitExercise("NOPE", userId, "print(1)", provider);
    expect(error).toBe("Exercise not found");
    expect(result).toBeUndefined();
    expect(provider.submitted).toBeNull();
  });
});

describe("provider abstraction", () => {
  it("defaults to the local mock, which never executes code", async () => {
    expect(process.env.EXECUTION_PROVIDER).toBeUndefined();
    const provider = getExecutionProvider();
    expect(provider).toBe(mockExecutionProvider);
    expect(provider.executesCode).toBe(false);
    expect(provider.name).toBe("local-mock");

    const run = await provider.run({ code: "print(1)", language: "python" });
    expect(run.status).toBe("unavailable");
    expect(run.error).toMatch(/not available/i);
  });

  it("records an unavailable submission without claiming a pass or a fail", async () => {
    userId = await createUser();
    const exercise = await createExerciseFixture("E_SUB_UNAVAIL", "EX_SKILL_UNAVAIL");

    const { result } = await submitExercise(exercise.id, userId, "print(1)\n");
    expect(result!.status).toBe("unavailable");
    expect(result!.passed).toBe(false);
    expect(result!.testsPassed).toBe(0);
    expect(result!.results).toHaveLength(0);

    const attempt = await prisma.exerciseAttempt.findUnique({ where: { id: result!.attemptId } });
    expect(attempt!.status).toBe("unavailable");
    expect(attempt!.code).toBe("print(1)\n");

    const progress = await prisma.userExerciseProgress.findUnique({
      where: { userId_exerciseId: { userId: userId!, exerciseId: exercise.id } },
    });
    expect(progress!.attempted).toBe(true);
    expect(progress!.solved).toBe(false);
  });
});

describe("runExercise", () => {
  it("runs through the provider and returns its result", async () => {
    userId = await createUser();
    const provider = new FakeProvider({
      status: "ok",
      stdout: "7",
      stderr: "",
      executionTimeMs: 12,
    });

    const { result } = await runExercise("print(3 + 4)", "python", provider);
    expect(result!.status).toBe("ok");
    expect(result!.stdout).toBe("7");
    expect(provider.ran).toMatchObject({ code: "print(3 + 4)", language: "python" });
  });
});

describe("validation", () => {
  it("rejects empty code before contacting any provider", async () => {
    userId = await createUser();
    const exercise = await createExerciseFixture("E_VALID_EMPTY", "EX_SKILL_VALID");
    const provider = new FakeProvider({ status: "ok", stdout: "", stderr: "" });

    const { error } = await submitExercise(exercise.id, userId, "   \n", provider);
    expect(error).toBe("Code is empty");
    expect(provider.submitted).toBeNull();

    const { error: runError } = await runExercise("", "python", provider);
    expect(runError).toBe("Code is empty");
    expect(provider.ran).toBeNull();
  });

  it("rejects oversized code", () => {
    expect(codeValidationError("x".repeat(MAX_CODE_LENGTH + 1))).toMatch(/too long/i);
    expect(codeValidationError("print(1)")).toBeNull();
  });
});
