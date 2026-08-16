import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "./db";
import {
  getCompletedSkillIds,
  getLesson,
  getRoadmap,
  getUserStats,
  toggleSkillCompletion,
} from "./queries";

let userId: string | null = null;
const skillIds: string[] = [];

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

async function createSkill(prefix: string, prereqIds: string[] = []): Promise<string> {
  const id = uid(prefix);
  skillIds.push(id);
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
    data: {
      username: suffix,
      email: `${suffix}@test.local`,
      passwordHash: "not-a-real-hash",
    },
  });
  return user.id;
}

async function markCompleted(skillId: string): Promise<void> {
  await prisma.userSkill.create({
    data: { userId: userId!, skillId, completed: true, completedAt: new Date() },
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
  for (const id of skillIds) {
    await prisma.skill.delete({ where: { id } }).catch(() => {});
  }
  skillIds.length = 0;
}

afterEach(async () => {
  await cleanup();
});

describe("getCompletedSkillIds", () => {
  it("returns only the completed skills for a user", async () => {
    userId = await createUser();
    const done = await createSkill("done");
    const pending = await createSkill("pending");
    await markCompleted(done);

    const completed = await getCompletedSkillIds(userId);
    expect(completed.has(done)).toBe(true);
    expect(completed.has(pending)).toBe(false);
  });
});

describe("getRoadmap", () => {
  it("unlocks a skill once its prerequisites are completed", async () => {
    userId = await createUser();
    const a = await createSkill("a");
    const b = await createSkill("b", [a]);
    const c = await createSkill("c", [b]);
    await markCompleted(a);

    const roadmap = await getRoadmap(userId);
    const byId = new Map(roadmap.map((s) => [s.id, s]));
    expect(byId.get(a)?.status).toBe("COMPLETED");
    expect(byId.get(b)?.status).toBe("UNLOCKED");
    expect(byId.get(c)?.status).toBe("LOCKED");
  });
});

describe("toggleSkillCompletion", () => {
  it("completes an unlocked skill and persists the change", async () => {
    userId = await createUser();
    const a = await createSkill("a");
    const b = await createSkill("b", [a]);
    await markCompleted(a);

    const result = await toggleSkillCompletion(userId!, b);
    expect(result).toEqual({ ok: true });
    expect((await getCompletedSkillIds(userId!)).has(b)).toBe(true);
  });

  it("refuses to complete a locked skill", async () => {
    userId = await createUser();
    const a = await createSkill("a");
    const b = await createSkill("b", [a]);

    const result = await toggleSkillCompletion(userId!, b);
    expect(result).toEqual({ ok: false, error: "Complete the prerequisite skills first" });
    expect((await getCompletedSkillIds(userId!)).size).toBe(0);
  });

  it("reports an error for an unknown skill", async () => {
    userId = await createUser();
    const result = await toggleSkillCompletion(userId!, "DOES_NOT_EXIST");
    expect(result).toEqual({ ok: false, error: "Skill not found" });
  });

  it("cascades uncompletion through the dependent chain", async () => {
    userId = await createUser();
    const a = await createSkill("a");
    const b = await createSkill("b", [a]);
    const c = await createSkill("c", [b]);
    await markCompleted(a);
    await toggleSkillCompletion(userId!, b);
    await toggleSkillCompletion(userId!, c);
    expect((await getCompletedSkillIds(userId!)).has(c)).toBe(true);

    const result = await toggleSkillCompletion(userId!, a);
    expect(result).toEqual({ ok: true });

    const completed = await getCompletedSkillIds(userId!);
    expect(completed.has(a)).toBe(false);
    expect(completed.has(b)).toBe(false);
    expect(completed.has(c)).toBe(false);
  });
});

describe("getUserStats", () => {
  it("computes counts and progress percentage", async () => {
    userId = await createUser();
    const a = await createSkill("a");
    const b = await createSkill("b", [a]);
    const c = await createSkill("c", [b]);
    await markCompleted(a);
    await markCompleted(b);

    const stats = await getUserStats(userId!);
    expect(stats.total).toBe(3);
    expect(stats.completed).toBe(2);
    expect(stats.unlocked).toBe(1);
    expect(stats.locked).toBe(0);
    expect(stats.progressPercent).toBe(67);
    expect(stats.completedSkills.map((s) => s.id).sort()).toEqual([a, b].sort());
    expect(stats.completedSkills.find((s) => s.id === c)).toBeUndefined();
  });
});

describe("getLesson", () => {
  it("returns the lesson and its completion state", async () => {
    userId = await createUser();
    const skillId = await createSkill("lesson");
    const lesson = await prisma.lesson.create({
      data: {
        skillId,
        title: "Lesson one",
        content: "# Hello",
        order: 0,
      },
    });

    const before = await getLesson(lesson.id, userId!);
    expect(before).not.toBeNull();
    expect(before!.title).toBe("Lesson one");
    expect(before!.completed).toBe(false);

    await prisma.lessonProgress.create({
      data: { userId: userId!, lessonId: lesson.id, completed: true, completedAt: new Date() },
    });

    const after = await getLesson(lesson.id, userId!);
    expect(after!.completed).toBe(true);

    await prisma.lesson.delete({ where: { id: lesson.id } });
  });

  it("returns null for an unknown lesson", async () => {
    userId = await createUser();
    expect(await getLesson("DOES_NOT_EXIST", userId!)).toBeNull();
  });
});
