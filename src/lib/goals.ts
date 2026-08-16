import { prisma } from "@/lib/db";

/**
 * Phase H — course goals.
 *
 * Learners can pin up to MAX_ACTIVE_GOALS courses as "goals". Active goals
 * drive the dashboard/explore recommendations (see recommendations.ts) and the
 * profile learning path. A goal is soft-deleted by setting active = false so
 * history is preserved.
 */

export const MAX_ACTIVE_GOALS = 3;
export const GOAL_NOTE_MAX = 80;

export class GoalError extends Error {}

export interface GoalView {
  id: string;
  courseId: string | null;
  goal: string;
  courseTitle: string | null;
  courseSlug: string | null;
  courseCategory: string | null;
  courseDifficulty: string | null;
  createdAt: Date;
}

export interface CourseGoalOption {
  id: string;
  slug: string;
  title: string;
  category: string;
  difficulty: string;
}

/**
 * Pure guard for the goal-count and duplicate rules, kept separate so it is
 * trivially unit-testable.
 */
export function canAddGoal(input: {
  activeCount: number;
  existingCourseIds: string[];
  courseId: string;
}): { ok: true } | { ok: false; error: string } {
  if (input.activeCount >= MAX_ACTIVE_GOALS) {
    return { ok: false, error: `You can have at most ${MAX_ACTIVE_GOALS} active goals` };
  }
  if (input.existingCourseIds.includes(input.courseId)) {
    return { ok: false, error: "That course is already one of your goals" };
  }
  return { ok: true };
}

function toGoalView(row: {
  id: string;
  courseId: string | null;
  goal: string;
  createdAt: Date;
  course: { id: string; slug: string; title: string; category: string; difficulty: string } | null;
}): GoalView {
  return {
    id: row.id,
    courseId: row.courseId,
    goal: row.goal,
    courseTitle: row.course?.title ?? null,
    courseSlug: row.course?.slug ?? null,
    courseCategory: row.course?.category ?? null,
    courseDifficulty: row.course?.difficulty ?? null,
    createdAt: row.createdAt,
  };
}

export async function getUserGoals(userId: string): Promise<GoalView[]> {
  const rows = await prisma.userGoal.findMany({
    where: { userId, active: true },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      courseId: true,
      goal: true,
      createdAt: true,
      course: { select: { id: true, slug: true, title: true, category: true, difficulty: true } },
    },
  });
  return rows.map(toGoalView);
}

/** Public catalog subset used by goal pickers (no user data). */
export async function listCoursesForGoals(): Promise<CourseGoalOption[]> {
  const courses = await prisma.course.findMany({
    orderBy: { title: "asc" },
    select: { id: true, slug: true, title: true, category: true, difficulty: true },
  });
  return courses;
}

/** Adds an active goal referencing a seeded course. Throws GoalError on misuse. */
export async function addUserGoal(
  userId: string,
  courseId: string,
  note = "",
): Promise<GoalView> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, slug: true, title: true, category: true, difficulty: true },
  });
  if (!course) throw new GoalError("Course not found");

  const [activeRows, activeCount] = await Promise.all([
    prisma.userGoal.findMany({
      where: { userId, active: true },
      select: { courseId: true },
    }),
    prisma.userGoal.count({ where: { userId, active: true } }),
  ]);

  const guard = canAddGoal({
    activeCount,
    existingCourseIds: activeRows.flatMap((row) => (row.courseId ? [row.courseId] : [])),
    courseId,
  });
  if (!guard.ok) throw new GoalError(guard.error);

  const label = note.trim().slice(0, GOAL_NOTE_MAX) || course.title;

  const row = await prisma.userGoal.create({
    data: { userId, courseId, goal: label, active: true },
    select: {
      id: true,
      courseId: true,
      goal: true,
      createdAt: true,
      course: { select: { id: true, slug: true, title: true, category: true, difficulty: true } },
    },
  });
  return toGoalView(row);
}

/** Renames the goal label. Throws GoalError when the goal is not the user's. */
export async function updateGoalText(
  userId: string,
  goalId: string,
  text: string,
): Promise<GoalView> {
  const existing = await prisma.userGoal.findUnique({
    where: { id: goalId },
    select: { id: true, userId: true, active: true },
  });
  if (!existing || existing.userId !== userId || !existing.active) {
    throw new GoalError("Goal not found");
  }

  const trimmed = text.trim().slice(0, GOAL_NOTE_MAX);
  if (!trimmed) throw new GoalError("Goal label cannot be empty");

  const row = await prisma.userGoal.update({
    where: { id: goalId },
    data: { goal: trimmed },
    select: {
      id: true,
      courseId: true,
      goal: true,
      createdAt: true,
      course: { select: { id: true, slug: true, title: true, category: true, difficulty: true } },
    },
  });
  return toGoalView(row);
}

/** Soft-deletes an active goal. Returns the removed goal id. */
export async function removeUserGoal(userId: string, goalId: string): Promise<string> {
  const existing = await prisma.userGoal.findUnique({
    where: { id: goalId },
    select: { id: true, userId: true, active: true },
  });
  if (!existing || existing.userId !== userId || !existing.active) {
    throw new GoalError("Goal not found");
  }

  await prisma.userGoal.update({ where: { id: goalId }, data: { active: false } });
  return goalId;
}
