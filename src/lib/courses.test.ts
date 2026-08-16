import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "./db";
import { computeCourseProgress, getCourseBySlug, getCourses } from "./courses";
import { formatMinutes } from "./format";

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

describe("computeCourseProgress", () => {
  it("returns zeroes for an empty skill list", () => {
    expect(computeCourseProgress(new Set(), [])).toEqual({
      total: 0,
      completed: 0,
      percent: 0,
      done: false,
    });
  });

  it("returns 0% with nothing completed", () => {
    const progress = computeCourseProgress(new Set(), ["a", "b", "c"]);
    expect(progress).toEqual({ total: 3, completed: 0, percent: 0, done: false });
  });

  it("counts partial completion and rounds the percentage", () => {
    const progress = computeCourseProgress(new Set(["a"]), ["a", "b", "c"]);
    expect(progress.completed).toBe(1);
    expect(progress.percent).toBe(33);
    expect(progress.done).toBe(false);
  });

  it("marks a course done only when every skill is completed", () => {
    const progress = computeCourseProgress(new Set(["a", "b", "c"]), ["a", "b", "c"]);
    expect(progress).toEqual({ total: 3, completed: 3, percent: 100, done: true });
  });
});

describe("formatMinutes", () => {
  it("formats minutes as minutes, hours, or both", () => {
    expect(formatMinutes(30)).toBe("30 min");
    expect(formatMinutes(60)).toBe("1 hr");
    expect(formatMinutes(90)).toBe("1 hr 30 min");
  });
});

describe("course catalog queries", () => {
  let userId: string | null = null;
  const createdCourses: string[] = [];
  const createdSkills: string[] = [];

  async function createSkill(id: string, prereqIds: string[] = []): Promise<string> {
    createdSkills.push(id);
    await prisma.skill.create({
      data: {
        id,
        name: id,
        description: `${id} description`,
        tier: "Core",
        x: 0,
        y: 0,
        prereqs: { create: prereqIds.map((prereqId) => ({ prereqId })) },
      },
    });
    return id;
  }

  async function createUser(): Promise<string> {
    const suffix = uid("u");
    const user = await prisma.user.create({
      data: { username: suffix, email: `${suffix}@test.local`, passwordHash: "x" },
    });
    return user.id;
  }

  async function createCourse(
    courseId: string,
    modules: { order: number; id: string; skillIds: string[] }[],
  ): Promise<string> {
    createdCourses.push(courseId);
    await prisma.course.create({
      data: {
        id: courseId,
        slug: courseId.toLowerCase(),
        title: "Course",
        description: "desc",
        category: "Programming",
        difficulty: "Beginner",
        estimatedMinutes: 30,
        objectives: "[]",
        modules: {
          create: modules.map((mod) => ({
            id: mod.id,
            title: `Module ${mod.order}`,
            description: "desc",
            order: mod.order,
            objectives: "[]",
            skills: { connect: mod.skillIds.map((id) => ({ id })) },
          })),
        },
      },
    });
    return courseId;
  }

  afterEach(async () => {
    if (userId) {
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
      userId = null;
    }
    for (const id of createdCourses) {
      await prisma.course.delete({ where: { id } }).catch(() => {});
    }
    createdCourses.length = 0;
    for (const id of createdSkills) {
      await prisma.skill.delete({ where: { id } }).catch(() => {});
    }
    createdSkills.length = 0;
  });

  it("orders modules by their order field, not creation order", async () => {
    const a = await createSkill("a");
    const b = await createSkill("b", [a]);
    const c = await createSkill("c", [b]);
    const courseId = uid("c");
    await createCourse(courseId, [
      { order: 2, id: uid("m"), skillIds: [c] },
      { order: 0, id: uid("m"), skillIds: [a] },
      { order: 1, id: uid("m"), skillIds: [b] },
    ]);

    const detail = await getCourseBySlug(courseId.toLowerCase(), null);
    expect(detail).not.toBeNull();
    expect(detail!.modules.map((m) => m.order)).toEqual([0, 1, 2]);
  });

  it("computes progress and per-skill statuses for a logged-in user", async () => {
    userId = await createUser();
    const a = await createSkill("a");
    const b = await createSkill("b", [a]);
    const c = await createSkill("c", [b]);
    const courseId = uid("c");
    await createCourse(courseId, [
      { order: 0, id: uid("m"), skillIds: [a] },
      { order: 1, id: uid("m"), skillIds: [b, c] },
    ]);
    await prisma.userSkill.create({
      data: { userId, skillId: a, completed: true, completedAt: new Date() },
    });

    const detail = await getCourseBySlug(courseId.toLowerCase(), userId);
    expect(detail!.progress).toEqual({ total: 3, completed: 1, percent: 33, done: false });

    const statusBySkill = new Map(
      detail!.modules.flatMap((m) => m.skills.map((s) => [s.id, s.status] as const)),
    );
    expect(statusBySkill.get(a)).toBe("COMPLETED");
    expect(statusBySkill.get(b)).toBe("UNLOCKED");
    expect(statusBySkill.get(c)).toBe("LOCKED");
  });

  it("reports skills that are prerequisites but outside the course", async () => {
    const a = await createSkill("a");
    const b = await createSkill("b", [a]);
    const courseId = uid("c");
    await createCourse(courseId, [{ order: 0, id: uid("m"), skillIds: [b] }]);

    const detail = await getCourseBySlug(courseId.toLowerCase(), null);
    expect(detail!.externalPrerequisites.map((p) => p.id)).toContain(a);
    expect(detail!.externalPrerequisites.map((p) => p.name)).toContain(a);
  });

  it("returns null for an unknown slug", async () => {
    expect(await getCourseBySlug("does-not-exist", null)).toBeNull();
  });

  it("returns no progress or statuses for anonymous visitors", async () => {
    const a = await createSkill("a");
    const courseId = uid("c");
    await createCourse(courseId, [{ order: 0, id: uid("m"), skillIds: [a] }]);

    const detail = await getCourseBySlug(courseId.toLowerCase(), null);
    expect(detail!.progress).toBeNull();
    expect(detail!.modules[0].skills[0].status).toBeNull();
  });

  it("lists course summaries with counts and per-user progress", async () => {
    userId = await createUser();
    const a = await createSkill("a");
    const b = await createSkill("b", [a]);
    const courseId = uid("c");
    await createCourse(courseId, [
      { order: 0, id: uid("m"), skillIds: [a] },
      { order: 1, id: uid("m"), skillIds: [b] },
    ]);
    await prisma.userSkill.create({
      data: { userId, skillId: a, completed: true, completedAt: new Date() },
    });

    const summaries = await getCourses(userId);
    const mine = summaries.find((s) => s.id === courseId);
    expect(mine).toBeDefined();
    expect(mine!.moduleCount).toBe(2);
    expect(mine!.skillCount).toBe(2);
    expect(mine!.progress).toEqual({ total: 2, completed: 1, percent: 50, done: false });

    const anon = await getCourses(null);
    expect(anon.find((s) => s.id === courseId)!.progress).toBeNull();
  });
});
