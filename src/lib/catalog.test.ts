import { afterEach, describe, expect, it } from "vitest";
import { skills } from "../../data/skills";
import { courses } from "../../data/courses";
import { exercises } from "../../data/exercises";
import { projects } from "../../data/projects";
import { lessons } from "../../data/lessons";
import {
  validateCatalog,
  validateCatalogData,
  validateExercises,
  validateLessons,
  validateProjects,
} from "./catalog";
import { prisma } from "./db";

describe("catalog content integrity", () => {
  it("finds no issues for the seeded catalog", () => {
    expect(validateCatalogData(skills, courses, exercises, projects, lessons)).toEqual([]);
  });

  it("flags lessons with unknown skills, bad metadata or malformed checkpoints", () => {
    const bad = [
      {
        ...lessons[0],
        skillId: "DOES_NOT_EXIST",
        description: " ",
        estimatedMinutes: 0,
        difficulty: "Expert",
        checkpoints: [
          {
            ...lessons[0].checkpoints[0],
            options: ["only one"],
            correctIndex: 4,
            explanation: " ",
          },
        ],
      },
    ];
    const messages = validateLessons(skills, bad).map((i) => i.message);
    expect(messages.some((m) => m.includes("unknown skill"))).toBe(true);
    expect(messages.some((m) => m === "missing description")).toBe(true);
    expect(messages.some((m) => m === "estimatedMinutes must be positive")).toBe(true);
    expect(messages.some((m) => m.includes("invalid difficulty"))).toBe(true);
    expect(messages.some((m) => m.includes("at least 2 options"))).toBe(true);
    expect(messages.some((m) => m.includes("correctIndex out of range"))).toBe(true);
    expect(messages.some((m) => m.includes("missing explanation"))).toBe(true);
  });

  it("flags module skills that do not exist", () => {
    const bad = [
      { ...courses[0], modules: [{ ...courses[0].modules[0], skillIds: ["DOES_NOT_EXIST"] }] },
    ];
    const issues = validateCatalog(skills, bad);
    expect(issues.some((i) => i.message.includes("unknown skill"))).toBe(true);
  });

  it("flags duplicate module orders within a course", () => {
    const modules = courses[0].modules.map((m) => ({ ...m, order: 0 }));
    const issues = validateCatalog(skills, [{ ...courses[0], modules }]);
    expect(issues.some((i) => i.message.includes("duplicate order"))).toBe(true);
  });

  it("flags duplicate course slugs", () => {
    const issues = validateCatalog(skills, [
      courses[0],
      { ...courses[0], id: "PYTHON_BEGINNERS_COPY" },
    ]);
    expect(issues.some((i) => i.message.includes("duplicate slug"))).toBe(true);
  });

  it("flags exercises missing test cases or with empty expected output", () => {
    const noTestCases = [{ ...exercises[0], id: "EX_NO_TC", testCases: [] }];
    expect(
      validateExercises(skills, noTestCases).some((i) => i.message === "no test cases"),
    ).toBe(true);

    const emptyOutput = [
      {
        ...exercises[0],
        id: "EX_EMPTY_OUT",
        testCases: [{ input: "", expectedOutput: "   ", description: "", order: 0 }],
      },
    ];
    expect(
      validateExercises(skills, emptyOutput).some((i) => i.message === "empty expectedOutput"),
    ).toBe(true);
  });

  it("flags exercises without a language", () => {
    const noLanguage = [{ ...exercises[0], id: "EX_NO_LANG", language: " " }];
    expect(
      validateExercises(skills, noLanguage).some((i) => i.message === "missing language"),
    ).toBe(true);
  });

  it("flags projects with unknown skills or missing milestones", () => {
    const unknownSkill = [{ ...projects[0], id: "PRJ_BAD_SKILL", skillId: "DOES_NOT_EXIST" }];
    expect(
      validateProjects(skills, unknownSkill).some((i) => i.message.includes("unknown skill")),
    ).toBe(true);

    const noMilestones = [{ ...projects[0], id: "PRJ_NO_MILESTONES", milestones: [] }];
    expect(
      validateProjects(skills, noMilestones).some((i) => i.message === "no milestones"),
    ).toBe(true);
  });
});

describe("catalog data model", () => {
  let userId: string | null = null;
  const createdCourses: string[] = [];
  const createdSkills: string[] = [];
  const createdAchievements: string[] = [];

  function uid(prefix: string): string {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  async function createSkill(): Promise<string> {
    const id = uid("s");
    createdSkills.push(id);
    await prisma.skill.create({
      data: { id, name: id, description: "desc", tier: "Core", x: 0, y: 0 },
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
    for (const id of createdAchievements) {
      await prisma.achievement.delete({ where: { id } }).catch(() => {});
    }
    createdAchievements.length = 0;
  });

  it("persists a course with modules linked to skills", async () => {
    const skillId = await createSkill();
    const courseId = uid("c");
    createdCourses.push(courseId);

    await prisma.course.create({
      data: {
        id: courseId,
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
              skills: { connect: [{ id: skillId }] },
            },
          ],
        },
      },
    });

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { modules: { include: { skills: true } } },
    });
    expect(course).not.toBeNull();
    expect(course!.modules).toHaveLength(1);
    expect(course!.modules[0].skills.map((s) => s.id)).toContain(skillId);
  });

  it("persists an exercise with test cases", async () => {
    const skillId = await createSkill();
    const exerciseId = uid("e");

    await prisma.exercise.create({
      data: {
        id: exerciseId,
        skillId,
        title: "Exercise",
        prompt: "prompt",
        language: "python",
        starterCode: "",
        solution: "",
        hints: "[]",
        difficulty: "Easy",
        order: 0,
        testCases: {
          create: [{ input: "2", expectedOutput: "4", description: "desc", order: 0 }],
        },
      },
    });

    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId },
      include: { testCases: true },
    });
    expect(exercise!.testCases).toHaveLength(1);
    expect(exercise!.testCases[0].expectedOutput).toBe("4");

    await prisma.exercise.delete({ where: { id: exerciseId } });
  });

  it("persists a project and a user completion record for it", async () => {
    userId = await createUser();
    const skillId = await createSkill();
    const projectId = uid("p");

    await prisma.project.create({
      data: {
        id: projectId,
        skillId,
        title: "Project",
        description: "desc",
        difficulty: "Beginner",
        estimatedMinutes: 30,
        objectives: "[]",
        requirements: "[]",
        hints: "[]",
        milestones: "[]",
        expectedOutput: "",
      },
    });
    await prisma.userProject.create({
      data: { userId, projectId, completed: true, completedAt: new Date() },
    });

    const record = await prisma.userProject.findUnique({
      where: { userId_projectId: { userId, projectId } },
    });
    expect(record?.completed).toBe(true);

    await prisma.project.delete({ where: { id: projectId } });
  });

  it("persists a user goal, an xp event and an achievement unlock", async () => {
    userId = await createUser();

    await prisma.userGoal.create({
      data: {
        id: uid("g"),
        userId,
        goal: "Learn Python",
        level: "Beginner",
        careerGoal: "Web developer",
        focusIds: '["Python"]',
      },
    });
    await prisma.xpEvent.create({
      data: { userId, amount: 50, reason: "SKILL_COMPLETED" },
    });

    const achievementId = uid("ach");
    createdAchievements.push(achievementId);
    await prisma.achievement.create({
      data: {
        id: achievementId,
        title: "First step",
        description: "desc",
        category: "milestone",
        xpReward: 10,
      },
    });
    await prisma.userAchievement.create({ data: { userId, achievementId } });

    const goals = await prisma.userGoal.findMany({ where: { userId } });
    expect(goals).toHaveLength(1);
    expect(goals[0].goal).toBe("Learn Python");

    const xp = await prisma.xpEvent.findMany({ where: { userId } });
    expect(xp).toHaveLength(1);
    expect(xp[0].amount).toBe(50);

    const unlocked = await prisma.userAchievement.findMany({ where: { userId } });
    expect(unlocked).toHaveLength(1);
    expect(unlocked[0].achievementId).toBe(achievementId);
  });

  it("a user goal can point at a course and survives its deletion", async () => {
    userId = await createUser();
    const courseId = uid("c");
    createdCourses.push(courseId);

    await prisma.course.create({
      data: {
        id: courseId,
        slug: uid("slug"),
        title: "Course",
        description: "desc",
        category: "Programming",
        difficulty: "Beginner",
        estimatedMinutes: 30,
        objectives: "[]",
      },
    });
    const goalId = uid("g");
    await prisma.userGoal.create({ data: { id: goalId, userId, goal: "Path", courseId } });

    await prisma.course.delete({ where: { id: courseId } });

    const goal = await prisma.userGoal.findUnique({ where: { id: goalId } });
    expect(goal).not.toBeNull();
    expect(goal!.courseId).toBeNull();
  });
});
