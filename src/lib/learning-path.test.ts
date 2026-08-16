import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { buildPath, getLearningPath, type LearningPathInput } from "@/lib/learning-path";

function makeInput(overrides: Partial<LearningPathInput> = {}): LearningPathInput {
  return {
    courseId: "COURSE",
    courseTitle: "Test Course",
    modules: [
      { id: "M1", title: "Module One", order: 0, skillIds: ["A", "B"] },
      { id: "M2", title: "Module Two", order: 1, skillIds: ["C", "D"] },
    ],
    statuses: new Map([
      ["A", "UNLOCKED"],
      ["B", "LOCKED"],
      ["C", "LOCKED"],
      ["D", "LOCKED"],
    ]),
    prereqs: new Map([
      ["B", ["A"]],
      ["C", ["A"]],
      ["D", ["C"]],
    ]),
    skillNames: new Map([
      ["A", "Alpha"],
      ["B", "Bravo"],
      ["C", "Charlie"],
      ["D", "Delta"],
    ]),
    ...overrides,
  };
}

const statusOf = (path: ReturnType<typeof buildPath>, skillId: string) =>
  path.modules.flatMap((mod) => mod.skills).find((skill) => skill.skillId === skillId)?.status;

describe("buildPath", () => {
  it("marks the first available skill as NEXT and the rest LOCKED for a fresh learner", () => {
    const path = buildPath(makeInput());
    expect(statusOf(path, "A")).toBe("NEXT");
    expect(statusOf(path, "B")).toBe("LOCKED");
    expect(statusOf(path, "C")).toBe("LOCKED");
    expect(statusOf(path, "D")).toBe("LOCKED");
    expect(path.completed).toBe(0);
    expect(path.total).toBe(4);
  });

  it("advances NEXT once the prerequisite is completed", () => {
    const path = buildPath(
      makeInput({
        statuses: new Map([
          ["A", "COMPLETED"],
          ["B", "UNLOCKED"],
          ["C", "UNLOCKED"],
          ["D", "LOCKED"],
        ]),
      }),
    );
    expect(statusOf(path, "A")).toBe("COMPLETED");
    expect(statusOf(path, "B")).toBe("NEXT");
    expect(statusOf(path, "C")).toBe("CURRENT");
    expect(statusOf(path, "D")).toBe("LOCKED");
    expect(path.completed).toBe(1);
  });

  it("keeps one NEXT even when several skills are available", () => {
    const path = buildPath(
      makeInput({
        statuses: new Map([
          ["A", "COMPLETED"],
          ["B", "UNLOCKED"],
          ["C", "UNLOCKED"],
          ["D", "LOCKED"],
        ]),
      }),
    );
    const nextSkills = path.modules.flatMap((mod) => mod.skills).filter((skill) => skill.status === "NEXT");
    expect(nextSkills).toHaveLength(1);
    expect(nextSkills[0].skillId).toBe("B");
  });

  it("marks every skill COMPLETED when the course is finished", () => {
    const path = buildPath(
      makeInput({
        statuses: new Map([
          ["A", "COMPLETED"],
          ["B", "COMPLETED"],
          ["C", "COMPLETED"],
          ["D", "COMPLETED"],
        ]),
      }),
    );
    expect(path.completed).toBe(4);
    for (const skill of path.modules.flatMap((mod) => mod.skills)) {
      expect(skill.status).toBe("COMPLETED");
    }
  });

  it("surfaces external prerequisites that block a locked skill", () => {
    const path = buildPath(
      makeInput({
        modules: [{ id: "M1", title: "Module One", order: 0, skillIds: ["B"] }],
        statuses: new Map([
          ["A", "UNLOCKED"],
          ["B", "LOCKED"],
          ["C", "LOCKED"],
          ["D", "LOCKED"],
        ]),
      }),
    );
    const bravo = path.modules[0].skills[0];
    expect(bravo.status).toBe("LOCKED");
    expect(bravo.prerequisites).toEqual([
      { skillId: "A", skillName: "Alpha", satisfied: false },
    ]);
  });

  it("lists only unsatisfied prerequisites as blocking, but shows satisfied ones too", () => {
    const path = buildPath(
      makeInput({
        statuses: new Map([
          ["A", "COMPLETED"],
          ["B", "UNLOCKED"],
          ["C", "UNLOCKED"],
          ["D", "LOCKED"],
        ]),
      }),
    );
    const bravo = path.modules[0].skills[1];
    expect(bravo.prerequisites).toEqual([
      { skillId: "A", skillName: "Alpha", satisfied: true },
    ]);
  });

  it("orders modules by their order field, not insertion order", () => {
    const path = buildPath(
      makeInput({
        modules: [
          { id: "M2", title: "Module Two", order: 1, skillIds: ["C", "D"] },
          { id: "M1", title: "Module One", order: 0, skillIds: ["A", "B"] },
        ],
      }),
    );
    expect(path.modules.map((mod) => mod.id)).toEqual(["M1", "M2"]);
  });

  it("handles an empty course", () => {
    const path = buildPath(makeInput({ modules: [], statuses: new Map() }));
    expect(path.modules).toEqual([]);
    expect(path.completed).toBe(0);
    expect(path.total).toBe(0);
  });
});

let suffix = 0;
const uid = (prefix: string): string => `${prefix}_PATH_${suffix++}_${Date.now()}`;

const createdUsers: string[] = [];
const createdSkills: string[] = [];
const createdCourses: string[] = [];

async function createUser(): Promise<string> {
  const id = uid("u");
  const created = await prisma.user.create({
    data: { username: id, email: `${id}@test.local`, passwordHash: "x" },
  });
  createdUsers.push(created.id);
  return created.id;
}

async function createSkill(skillId: string): Promise<void> {
  createdSkills.push(skillId);
  await prisma.skill.create({
    data: { id: skillId, name: skillId, description: "desc", tier: "Core", x: 0, y: 0 },
  });
}

afterEach(async () => {
  for (const id of createdUsers) {
    await prisma.user.delete({ where: { id } }).catch(() => {});
  }
  createdUsers.length = 0;
  for (const id of createdSkills) {
    await prisma.skill.delete({ where: { id } }).catch(() => {});
  }
  createdSkills.length = 0;
  for (const id of createdCourses) {
    await prisma.course.delete({ where: { id } }).catch(() => {});
  }
  createdCourses.length = 0;
});

describe("getLearningPath", () => {
  it("returns a null path for an unknown course", async () => {
    const userId = await createUser();
    await expect(getLearningPath(userId, uid("nope"))).resolves.toBeNull();
  });

  it("builds the path for a fresh learner over a real course", async () => {
    const userId = await createUser();
    await createSkill("PATH_A");
    await createSkill("PATH_B");
    await prisma.prerequisite.create({
      data: { skillId: "PATH_B", prereqId: "PATH_A" },
    }).catch(() => {});

    const courseId = uid("c");
    createdCourses.push(courseId);
    await prisma.course.create({
      data: {
        id: courseId,
        slug: uid("slug"),
        title: "Path Course",
        description: "desc",
        category: "Programming",
        difficulty: "Beginner",
        estimatedMinutes: 30,
        objectives: "[]",
        modules: {
          create: [
            {
              id: uid("m"),
              title: "Module One",
              description: "desc",
              order: 0,
              objectives: "[]",
              skills: { connect: [{ id: "PATH_A" }, { id: "PATH_B" }] },
            },
          ],
        },
      },
    });

    const path = await getLearningPath(userId, courseId);
    expect(path).not.toBeNull();
    expect(path!.courseTitle).toBe("Path Course");
    const skills = path!.modules[0].skills;
    expect(skills.map((skill) => skill.skillId)).toContain("PATH_A");
    expect(skills.find((skill) => skill.skillId === "PATH_A")?.status).toBe("NEXT");
    expect(skills.find((skill) => skill.skillId === "PATH_B")?.status).toBe("LOCKED");
  });
});
