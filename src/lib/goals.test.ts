import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import {
  addUserGoal,
  canAddGoal,
  GoalError,
  getUserGoals,
  listCoursesForGoals,
  MAX_ACTIVE_GOALS,
  removeUserGoal,
  updateGoalText,
} from "@/lib/goals";

let suffix = 0;
const uid = (prefix: string): string => `${prefix}_GOAL_${suffix++}_${Date.now()}`;

const createdUsers: string[] = [];
const createdCourses: string[] = [];

async function createUser(): Promise<string> {
  const id = uid("u");
  const created = await prisma.user.create({
    data: { username: id, email: `${id}@test.local`, passwordHash: "x" },
  });
  createdUsers.push(created.id);
  return created.id;
}

async function createCourse(overrides: Partial<{ title: string; category: string; difficulty: string }> = {}): Promise<string> {
  const id = uid("c");
  createdCourses.push(id);
  await prisma.course.create({
    data: {
      id,
      slug: uid("slug"),
      title: overrides.title ?? "Test Course",
      description: "desc",
      category: overrides.category ?? "Programming",
      difficulty: overrides.difficulty ?? "Beginner",
      estimatedMinutes: 30,
      objectives: "[]",
    },
  });
  return id;
}

afterEach(async () => {
  for (const id of createdUsers) {
    await prisma.user.delete({ where: { id } }).catch(() => {});
  }
  createdUsers.length = 0;
  for (const id of createdCourses) {
    await prisma.course.delete({ where: { id } }).catch(() => {});
  }
  createdCourses.length = 0;
});

describe("canAddGoal", () => {
  it("allows a new course goal under the limit", () => {
    const result = canAddGoal({ activeCount: 0, existingCourseIds: ["c1"], courseId: "c2" });
    expect(result.ok).toBe(true);
  });

  it("rejects when the limit is reached", () => {
    const result = canAddGoal({ activeCount: MAX_ACTIVE_GOALS, existingCourseIds: [], courseId: "c2" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("3");
  });

  it("rejects duplicate course goals", () => {
    const result = canAddGoal({ activeCount: 0, existingCourseIds: ["c1"], courseId: "c1" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("already");
  });
});

describe("addUserGoal", () => {
  it("creates an active goal with the course title as default label", async () => {
    const userId = await createUser();
    const courseId = await createCourse({ title: "C Fundamentals" });

    const goal = await addUserGoal(userId, courseId);
    expect(goal.courseId).toBe(courseId);
    expect(goal.goal).toBe("C Fundamentals");
    expect(goal.courseSlug).not.toBeNull();

    const stored = await prisma.userGoal.findUnique({ where: { id: goal.id } });
    expect(stored?.active).toBe(true);
  });

  it("uses a provided note as the goal label", async () => {
    const userId = await createUser();
    const courseId = await createCourse();

    const goal = await addUserGoal(userId, courseId, "Master C");
    expect(goal.goal).toBe("Master C");
  });

  it("rejects an unknown course", async () => {
    const userId = await createUser();
    await expect(addUserGoal(userId, uid("nope"))).rejects.toBeInstanceOf(GoalError);
  });

  it("rejects a duplicate active goal for the same course", async () => {
    const userId = await createUser();
    const courseId = await createCourse();
    await addUserGoal(userId, courseId);
    await expect(addUserGoal(userId, courseId)).rejects.toBeInstanceOf(GoalError);
  });

  it("rejects a fourth active goal", async () => {
    const userId = await createUser();
    const courses: string[] = [];
    for (let i = 0; i < MAX_ACTIVE_GOALS; i += 1) {
      const courseId = await createCourse({ title: `Course ${i}` });
      courses.push(courseId);
      await addUserGoal(userId, courseId);
    }
    const extra = await createCourse({ title: "Extra" });
    await expect(addUserGoal(userId, extra)).rejects.toBeInstanceOf(GoalError);
  });
});

describe("updateGoalText", () => {
  it("renames the goal label", async () => {
    const userId = await createUser();
    const courseId = await createCourse();
    const goal = await addUserGoal(userId, courseId, "Old label");

    const updated = await updateGoalText(userId, goal.id, "New label");
    expect(updated.goal).toBe("New label");
  });

  it("rejects an empty label", async () => {
    const userId = await createUser();
    const courseId = await createCourse();
    const goal = await addUserGoal(userId, courseId);
    await expect(updateGoalText(userId, goal.id, "   ")).rejects.toBeInstanceOf(GoalError);
  });

  it("rejects renaming another user's goal", async () => {
    const owner = await createUser();
    const other = await createUser();
    const courseId = await createCourse();
    const goal = await addUserGoal(owner, courseId);
    await expect(updateGoalText(other, goal.id, "hijack")).rejects.toBeInstanceOf(GoalError);
  });
});

describe("removeUserGoal", () => {
  it("soft-deletes the goal so it no longer appears as active", async () => {
    const userId = await createUser();
    const courseId = await createCourse();
    const goal = await addUserGoal(userId, courseId);

    const removedId = await removeUserGoal(userId, goal.id);
    expect(removedId).toBe(goal.id);
    expect(await getUserGoals(userId)).toHaveLength(0);

    const stored = await prisma.userGoal.findUnique({ where: { id: goal.id } });
    expect(stored?.active).toBe(false);
  });

  it("frees a slot for a new goal after removal", async () => {
    const userId = await createUser();
    const goalIds: string[] = [];
    for (let i = 0; i < MAX_ACTIVE_GOALS; i += 1) {
      const courseId = await createCourse({ title: `Course ${i}` });
      const goal = await addUserGoal(userId, courseId);
      goalIds.push(goal.id);
    }
    const removed = await removeUserGoal(userId, goalIds[0]);
    const extra = await createCourse({ title: "Extra" });
    const added = await addUserGoal(userId, extra);
    expect(added.courseId).toBe(extra);
    expect(removed).toBe(goalIds[0]);
  });

  it("rejects removing another user's goal", async () => {
    const owner = await createUser();
    const other = await createUser();
    const courseId = await createCourse();
    const goal = await addUserGoal(owner, courseId);
    await expect(removeUserGoal(other, goal.id)).rejects.toBeInstanceOf(GoalError);
  });
});

describe("getUserGoals / listCoursesForGoals", () => {
  it("returns only active goals in creation order", async () => {
    const userId = await createUser();
    const first = await addUserGoal(userId, await createCourse({ title: "First" }));
    const second = await addUserGoal(userId, await createCourse({ title: "Second" }));

    const goals = await getUserGoals(userId);
    expect(goals.map((g) => g.id)).toEqual([first.id, second.id]);
    expect(goals[0].courseTitle).toBe("First");
    expect(goals[1].courseTitle).toBe("Second");

    await removeUserGoal(userId, first.id);
    expect((await getUserGoals(userId)).map((g) => g.id)).toEqual([second.id]);
  });

  it("lists courses for the goal picker without user data", async () => {
    await createCourse({ title: "Zeta Course" });
    await createCourse({ title: "Alpha Course" });

    const options = await listCoursesForGoals();
    expect(options.length).toBeGreaterThanOrEqual(2);
    expect(options[0].title).toBe("Alpha Course");
    expect(options[0].slug).toBeTruthy();
  });
});
