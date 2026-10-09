import { prisma } from "@/lib/db";
import {
  codeValidationError,
  getExecutionProvider,
  type CodeExecutionProvider,
  type ExecutionResult,
  type TestResult,
} from "@/lib/execution";
import { checkRateLimit } from "@/lib/ratelimit";
import {
  computeExecutionCacheKey,
  getCachedExecution,
  setCachedExecution,
} from "@/lib/execution/cache";

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
  hintsUnlocked: number;
}

export interface ExerciseProblemView {
  id: string;
  title: string;
  prompt: string;
  description: string;
  requirements: string[];
  examples: { input: string; output: string; note?: string }[];
  constraints: string[];
  totalHintsCount: number;
  unlockedHints: string[];
  hints: string[];
  language: string;
  difficulty: string;
  starterCode: string;
  order: number;
  skill: { id: string; name: string };
  status: ExerciseStatusView | null;
  publicTestCases: ExerciseTestCaseView[];
  lastAttempt: {
    status: string;
    passed: boolean;
    testsPassed: number;
    testsTotal: number;
    createdAt: Date;
  } | null;
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

function parseExamples(
  value: string,
): { input: string; output: string; note?: string }[] {
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

async function getStatus(
  userId: string,
  exerciseId: string,
): Promise<ExerciseStatusView | null> {
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
    hintsUnlocked: progress.hintsUnlocked ?? 0,
  };
}

/**
 * Loads one exercise for the learner UI. Only public test cases are exposed;
 * the solution and hidden test cases are never sent to the client.
 * Hints are graduated: only unlocked hints are returned.
 */
export async function getExercise(
  exerciseId: string,
  userId: string,
): Promise<ExerciseProblemView | null> {
  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    include: {
      skill: { select: { id: true, name: true } },
      testCases: {
        where: { isPublic: true },
        orderBy: { order: "asc" },
      },
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

  const allHints = parseJsonArray(exercise.hints);
  const hintsUnlockedCount = status?.hintsUnlocked ?? 0;
  const unlockedHints = allHints.slice(0, hintsUnlockedCount);

  const publicTestCases: ExerciseTestCaseView[] = exercise.testCases.map((tc) => ({
    order: tc.order,
    description: tc.description,
    input: tc.input,
    expectedOutput: tc.expectedOutput,
  }));

  return {
    id: exercise.id,
    title: exercise.title,
    prompt: exercise.prompt,
    description: exercise.description,
    requirements: parseJsonArray(exercise.requirements),
    examples: parseExamples(exercise.examples),
    constraints: parseJsonArray(exercise.constraints),
    totalHintsCount: allHints.length,
    unlockedHints,
    hints: unlockedHints,
    language: exercise.language,
    difficulty: exercise.difficulty,
    starterCode: exercise.starterCode,
    order: exercise.order,
    skill: exercise.skill,
    status,
    publicTestCases,
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
            hintsUnlocked: row.hintsUnlocked ?? 0,
          }
        : null,
    };
  });
}

/**
 * Unlocks the next graduated hint for a learner on an exercise.
 */
export async function unlockHint(
  exerciseId: string,
  userId: string,
): Promise<{ error?: string; unlockedHints?: string[]; hintsUnlockedCount?: number }> {
  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    select: { hints: true },
  });
  if (!exercise) return { error: "Exercise not found" };

  const allHints = parseJsonArray(exercise.hints);
  if (allHints.length === 0) {
    return { error: "No hints available for this exercise." };
  }

  const progress = await prisma.userExerciseProgress.upsert({
    where: { userId_exerciseId: { userId, exerciseId } },
    update: {
      hintsUnlocked: { increment: 1 },
    },
    create: {
      userId,
      exerciseId,
      hintsUnlocked: 1,
    },
  });

  const count = Math.min(progress.hintsUnlocked, allHints.length);
  return {
    unlockedHints: allHints.slice(0, count),
    hintsUnlockedCount: count,
  };
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
  cached?: boolean;
  /** Results for all test cases (hidden test contents sanitized) */
  results: TestResult[];
}

/**
 * Grades a submission through the configured provider and records the
 * attempt plus progress. All pass/fail checks run strictly server-side.
 */
export async function submitExercise(
  exerciseId: string,
  userId: string,
  code: string,
  provider: CodeExecutionProvider = getExecutionProvider(),
): Promise<{ error?: string; result?: ExerciseSubmissionResult }> {
  const validationError = codeValidationError(code);
  if (validationError) return { error: validationError };

  // Shared Rate Limit check: 20 submits per minute for logged-in users
  const rateCheck = await checkRateLimit({
    key: `submit:${userId}`,
    limit: 20,
    windowSeconds: 60,
    actionName: "trial test submission",
  });
  if (!rateCheck.allowed) {
    return { error: rateCheck.reason };
  }

  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    include: { testCases: { orderBy: { order: "asc" } } },
  });
  if (!exercise) return { error: "Exercise not found" };
  if (exercise.testCases.length === 0) return { error: "Exercise has no test cases" };

  // Check Execution Cache for identical code
  const cacheKey = computeExecutionCacheKey(exercise.language, exercise.id, code);
  let execution = await getCachedExecution(cacheKey);
  let isCached = false;

  if (execution) {
    isCached = true;
  } else {
    // Execute against real runner with full public + hidden test harness
    execution = await provider.submit({
      code,
      language: exercise.language,
      testCases: exercise.testCases.map((tc) => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isPublic: tc.isPublic,
      })),
    });

    // Cache deterministic result
    await setCachedExecution(cacheKey, execution, 300);
  }

  const testsPassed =
    execution.testResults?.filter((t) => t.passed).length ?? 0;
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
      solvedAt: passed ? (existingProgress?.solved ? undefined : new Date()) : undefined,
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

  // Sanitize test results for client delivery:
  // Public test cases keep their input & expected output.
  // Hidden test cases have input, expected, and actual scrubbed to prevent leaking answers.
  const publicOrders = new Set(
    exercise.testCases.filter((tc) => tc.isPublic).map((tc) => tc.order),
  );

  const sanitizedResults: TestResult[] = (execution.testResults ?? []).map((t) => {
    if (publicOrders.has(t.order)) {
      return t;
    }
    return {
      order: t.order,
      name: `🔒 Hidden Battle Test ${t.order}`,
      passed: t.passed,
      isPublic: false,
      input: "[HIDDEN]",
      expectedOutput: "[HIDDEN]",
      actualOutput: t.passed ? "[PASSED]" : "[FAILED]",
      error: t.error ? "Hidden test assertion failed" : undefined,
    };
  });

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
    cached: isCached,
    results: sanitizedResults,
  };

  return { result };
}

/**
 * Runs learner code for dry run through the configured provider.
 */
export async function runExercise(
  code: string,
  language: string,
  userId?: string,
  provider: CodeExecutionProvider = getExecutionProvider(),
): Promise<{ error?: string; result?: ExecutionResult }> {
  const validationError = codeValidationError(code);
  if (validationError) return { error: validationError };

  // Rate limit: 30 runs/min for logged-in, 10 runs/min for anonymous
  const rateKey = userId ? `run:${userId}` : "run:guest";
  const rateLimit = userId ? 30 : 10;
  const rateCheck = await checkRateLimit({
    key: rateKey,
    limit: rateLimit,
    windowSeconds: 60,
    actionName: "dry run",
  });
  if (!rateCheck.allowed) {
    return { error: rateCheck.reason };
  }

  const cacheKey = computeExecutionCacheKey(language, "dry-run", code);
  const cached = await getCachedExecution(cacheKey);
  if (cached) {
    return { result: cached };
  }

  const result = await provider.run({ code, language });
  await setCachedExecution(cacheKey, result, 180);
  return { result };
}
