import { prisma } from "@/lib/db";
import {
  codeValidationError,
  getExecutionProvider,
  type CodeExecutionProvider,
  type ExecutionResult,
  type TestResult,
} from "@/lib/execution";

export interface ExerciseTestCaseView {
  order: number;
  description: string;
  input: string;
  expectedOutput: string;
}

export interface ExerciseStatusView {
  attempted: boolean;
  solved: boolean;
  attemptCount: number;
  lastAttemptAt: Date | null;
  bestTestsPassed: number;
  bestTestsTotal: number;
}

export interface ExerciseProblemView {
  id: string;
  title: string;
  prompt: string;
  description: string;
  requirements: string[];
  examples: { input: string; output: string; note?: string }[];
  constraints: string[];
  hints: string[];
  language: string;
  difficulty: string;
  starterCode: string;
  order: number;
  skill: { id: string; name: string };
  status: ExerciseStatusView | null;
  lastAttempt: { status: string; passed: boolean; testsPassed: number; testsTotal: number; createdAt: Date } | null;
}

export interface ExerciseSummaryView {
  id: string;
  title: string;
  prompt: string;
  difficulty: string;
  order: number;
  status: ExerciseStatusView | null;
}

function parseJsonArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function parseExamples(value: string): { input: string; output: string; note?: string }[] {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x) => x && typeof x === "object" && "input" in x && "output" in x,
    );
  } catch {
    return [];
  }
}

async function getStatus(userId: string, exerciseId: string): Promise<ExerciseStatusView | null> {
  const progress = await prisma.userExerciseProgress.findUnique({
    where: { userId_exerciseId: { userId, exerciseId } },
  });
  if (!progress) return null;
  return {
    attempted: progress.attempted,
    solved: progress.solved,
    attemptCount: progress.attemptCount,
    lastAttemptAt: progress.lastAttemptAt,
    bestTestsPassed: progress.bestTestsPassed,
    bestTestsTotal: progress.bestTestsTotal,
  };
}

/**
 * Loads one exercise for the learner UI. Only public test cases are exposed;
 * the solution and hidden test cases are never sent to the client.
 */
export async function getExercise(
  exerciseId: string,
  userId: string,
): Promise<ExerciseProblemView | null> {
  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    include: {
      skill: { select: { id: true, name: true } },
      testCases: { orderBy: { order: "asc" } },
    },
  });
  if (!exercise) return null;

  const [status, lastAttempt] = await Promise.all([
    getStatus(userId, exerciseId),
    prisma.exerciseAttempt.findFirst({
      where: { userId, exerciseId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    id: exercise.id,
    title: exercise.title,
    prompt: exercise.prompt,
    description: exercise.description,
    requirements: parseJsonArray(exercise.requirements),
    examples: parseExamples(exercise.examples),
    constraints: parseJsonArray(exercise.constraints),
    hints: parseJsonArray(exercise.hints),
    language: exercise.language,
    difficulty: exercise.difficulty,
    starterCode: exercise.starterCode,
    order: exercise.order,
    skill: exercise.skill,
    status,
    lastAttempt: lastAttempt
      ? {
          status: lastAttempt.status,
          passed: lastAttempt.passed,
          testsPassed: lastAttempt.testsPassed,
          testsTotal: lastAttempt.testsTotal,
          createdAt: lastAttempt.createdAt,
        }
      : null,
  };
}

/** Lists the exercises of a skill, ordered, with the user's solved status. */
export async function getExercisesBySkill(
  skillId: string,
  userId: string,
): Promise<ExerciseSummaryView[]> {
  const exercises = await prisma.exercise.findMany({
    where: { skillId },
    orderBy: { order: "asc" },
  });
  if (exercises.length === 0) return [];

  const progress = await prisma.userExerciseProgress.findMany({
    where: { userId, exerciseId: { in: exercises.map((e) => e.id) } },
  });
  const progressById = new Map(progress.map((p) => [p.exerciseId, p]));

  return exercises.map((exercise) => {
    const row = progressById.get(exercise.id);
    return {
      id: exercise.id,
      title: exercise.title,
      prompt: exercise.prompt,
      difficulty: exercise.difficulty,
      order: exercise.order,
      status: row
        ? {
            attempted: row.attempted,
            solved: row.solved,
            attemptCount: row.attemptCount,
            lastAttemptAt: row.lastAttemptAt,
            bestTestsPassed: row.bestTestsPassed,
            bestTestsTotal: row.bestTestsTotal,
          }
        : null,
    };
  });
}

export interface ExerciseSubmissionResult {
  status: ExecutionResult["status"];
  passed: boolean;
  testsPassed: number;
  testsTotal: number;
  stdout: string;
  stderr: string;
  executionTimeMs?: number;
  error?: string;
  attemptId: string;
  /** Results for PUBLIC test cases only — hidden cases are never revealed. */
  results: TestResult[];
}

/**
 * Grades a submission through the configured provider and records the
 * attempt plus progress. Provider is injectable for tests; hidden test cases
 * are passed to the provider but filtered out of the returned result.
 */
export async function submitExercise(
  exerciseId: string,
  userId: string,
  code: string,
  provider: CodeExecutionProvider = getExecutionProvider(),
): Promise<{ error?: string; result?: ExerciseSubmissionResult }> {
  const validationError = codeValidationError(code);
  if (validationError) return { error: validationError };

  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    include: { testCases: { orderBy: { order: "asc" } } },
  });
  if (!exercise) return { error: "Exercise not found" };
  if (exercise.testCases.length === 0) return { error: "Exercise has no test cases" };

  const execution = await provider.submit({
    code,
    language: exercise.language,
    testCases: exercise.testCases.map((testCase) => ({
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      isPublic: testCase.isPublic,
    })),
  });

  const testsPassed =
    execution.testResults?.filter((testResult) => testResult.passed).length ?? 0;
  const testsTotal = execution.testResults?.length ?? exercise.testCases.length;
  const passed =
    execution.status === "ok" &&
    testsTotal > 0 &&
    testsPassed === testsTotal;

  const attempt = await prisma.exerciseAttempt.create({
    data: {
      userId,
      exerciseId,
      language: exercise.language,
      code,
      status: execution.status,
      passed,
      testsPassed,
      testsTotal,
      stdout: execution.stdout,
      stderr: execution.stderr,
    },
  });

  const existingProgress = await prisma.userExerciseProgress.findUnique({
    where: { userId_exerciseId: { userId, exerciseId } },
  });
  const bestTestsPassed = Math.max(existingProgress?.bestTestsPassed ?? 0, testsPassed);
  const bestTestsTotal = Math.max(existingProgress?.bestTestsTotal ?? 0, testsTotal);

  await prisma.userExerciseProgress.upsert({
    where: { userId_exerciseId: { userId, exerciseId } },
    update: {
      attempted: true,
      attemptCount: { increment: 1 },
      solved: passed ? true : undefined,
      solvedAt: passed ? { set: new Date() } : undefined,
      bestTestsPassed,
      bestTestsTotal,
      lastAttemptAt: new Date(),
    },
    create: {
      userId,
      exerciseId,
      attempted: true,
      attemptCount: 1,
      solved: passed,
      solvedAt: passed ? new Date() : null,
      bestTestsPassed: testsPassed,
      bestTestsTotal: testsTotal,
      lastAttemptAt: new Date(),
    },
  });

  const publicOrders = new Set(
    exercise.testCases.filter((testCase) => testCase.isPublic).map((testCase) => testCase.order),
  );
  const visibleResults = (execution.testResults ?? [])
    .filter((testResult) => publicOrders.has(testResult.order))
    .map((testResult) => testResult);

  const result: ExerciseSubmissionResult = {
    status: execution.status,
    passed,
    testsPassed,
    testsTotal,
    stdout: execution.stdout,
    stderr: execution.stderr,
    executionTimeMs: execution.executionTimeMs,
    error: execution.error,
    attemptId: attempt.id,
    results: visibleResults,
  };

  return { result };
}

/**
 * Runs learner code through the configured provider without recording an
 * attempt. Provider is injectable for tests.
 */
export async function runExercise(
  code: string,
  language: string,
  provider: CodeExecutionProvider = getExecutionProvider(),
): Promise<{ error?: string; result?: ExecutionResult }> {
  const validationError = codeValidationError(code);
  if (validationError) return { error: validationError };

  const result = await provider.run({ code, language });
  return { result };
}
