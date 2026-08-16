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

import { auth } from "@/auth";
import { prisma } from "./db";
import {
  computeProjectProgress,
  getProject,
  getProjects,
  getProjectsBySkill,
  getProjectsBySkillIds,
  getDashboardProjects,
  getProgressProjects,
} from "./projects";
import {
  saveProjectNotes,
  startProject,
  toggleProjectCompletion,
  toggleProjectMilestone,
} from "./actions";

const authMock = vi.mocked(auth);

let userId: string | null = null;
const projectIds: string[] = [];
const skillIds: string[] = [];
const lessonIds: string[] = [];
const exerciseIds: string[] = [];
const courseIds: string[] = [];

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

interface ProjectSeed {
  id: string;
  skillId: string;
  relatedSkillIds: string[];
  title: string;
  order: number;
  milestones: string[];
  category?: string;
}

async function createProject(seed: ProjectSeed): Promise<void> {
  projectIds.push(seed.id);
  await prisma.project.create({
    data: {
      id: seed.id,
      skillId: seed.skillId,
      title: seed.title,
      description: `${seed.title} description`,
      category: seed.category ?? "Practice",
      difficulty: "Beginner",
      estimatedMinutes: 45,
      order: seed.order,
      objectives: JSON.stringify(["Build something"]),
      requirements: JSON.stringify(["It works"]),
      hints: JSON.stringify(["Think step by step"]),
      milestones: JSON.stringify(seed.milestones),
      expectedOutput: "",
      skills: {
        create: seed.relatedSkillIds.map((skillId) => ({ skillId })),
      },
    },
  });
}

async function createLesson(skillId: string): Promise<string> {
  const id = uid("l");
  lessonIds.push(id);
  await prisma.lesson.create({
    data: {
      id,
      skillId,
      title: "Lesson",
      description: "desc",
      estimatedMinutes: 10,
      difficulty: "Easy",
      order: 0,
      content: "[]",
      checkpoints: "[]",
    },
  });
  return id;
}

async function createExercise(skillId: string): Promise<string> {
  const id = uid("e");
  exerciseIds.push(id);
  await prisma.exercise.create({
    data: {
      id,
      skillId,
      title: "Exercise",
      prompt: "prompt",
      language: "python",
      starterCode: "",
      solution: "",
      hints: "[]",
      difficulty: "Easy",
      order: 0,
    },
  });
  return id;
}

async function createCourse(skillId: string): Promise<string> {
  const id = uid("c");
  courseIds.push(id);
  await prisma.course.create({
    data: {
      id,
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
  return id;
}

async function cleanup(): Promise<void> {
  if (userId) {
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    userId = null;
  }
  for (const id of projectIds) {
    await prisma.project.delete({ where: { id } }).catch(() => {});
  }
  projectIds.length = 0;
  for (const id of lessonIds) {
    await prisma.lesson.delete({ where: { id } }).catch(() => {});
  }
  lessonIds.length = 0;
  for (const id of exerciseIds) {
    await prisma.exercise.delete({ where: { id } }).catch(() => {});
  }
  exerciseIds.length = 0;
  for (const id of courseIds) {
    await prisma.course.delete({ where: { id } }).catch(() => {});
  }
  courseIds.length = 0;
  for (const id of skillIds) {
    await prisma.skill.delete({ where: { id } }).catch(() => {});
  }
  skillIds.length = 0;
}

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue(null as never);
});

afterEach(async () => {
  await cleanup();
});

describe("computeProjectProgress", () => {
  it("treats a project without milestones as not done", () => {
    const progress = computeProjectProgress(0, 0);
    expect(progress).toEqual({ completed: 0, total: 0, percent: 0, done: false });
  });

  it("computes partial progress", () => {
    const progress = computeProjectProgress(3, 1);
    expect(progress.done).toBe(false);
    expect(progress.percent).toBe(33);
  });

  it("marks the project done only when every milestone is complete", () => {
    expect(computeProjectProgress(3, 3).done).toBe(true);
    expect(computeProjectProgress(3, 3).percent).toBe(100);
    expect(computeProjectProgress(4, 2).done).toBe(false);
  });

  it("never reports a completion count beyond the total", () => {
    const progress = computeProjectProgress(2, 2);
    expect(progress.completed).toBe(2);
    expect(progress.percent).toBe(100);
  });
});

describe("project data access", () => {
  it("returns all projects ordered by the order field with linked skills", async () => {
    userId = await createUser();
    await createSkill("SKILL_A");
    await createSkill("SKILL_B");
    await createProject({
      id: uid("p"),
      skillId: "SKILL_A",
      relatedSkillIds: ["SKILL_A", "SKILL_B"],
      title: "Second",
      order: 2,
      milestones: ["One", "Two"],
    });
    await createProject({
      id: uid("p"),
      skillId: "SKILL_A",
      relatedSkillIds: ["SKILL_A"],
      title: "First",
      order: 1,
      milestones: ["One"],
    });

    const projects = await getProjects(userId);
    expect(projects).toHaveLength(2);
    expect(projects.map((project) => project.title)).toEqual(["First", "Second"]);
    expect(projects[0].skills.map((skill) => skill.id)).toEqual(["SKILL_A"]);
    expect(projects[1].skills.map((skill) => skill.id)).toEqual(["SKILL_A", "SKILL_B"]);
    expect(projects.every((project) => project.status === "not-started")).toBe(true);
  });

  it("filters projects by a related skill", async () => {
    userId = await createUser();
    await createSkill("SKILL_A");
    await createSkill("SKILL_B");
    await createProject({
      id: uid("p"),
      skillId: "SKILL_A",
      relatedSkillIds: ["SKILL_A"],
      title: "A project",
      order: 1,
      milestones: [],
    });
    await createProject({
      id: uid("p"),
      skillId: "SKILL_B",
      relatedSkillIds: ["SKILL_B"],
      title: "B project",
      order: 2,
      milestones: [],
    });

    const forA = await getProjectsBySkill("SKILL_A", userId);
    expect(forA.map((project) => project.title)).toEqual(["A project"]);
  });

  it("matches projects for any of the given skill ids", async () => {
    userId = await createUser();
    await createSkill("SKILL_A");
    await createSkill("SKILL_B");
    await createSkill("SKILL_C");
    await createProject({
      id: uid("p"),
      skillId: "SKILL_A",
      relatedSkillIds: ["SKILL_A"],
      title: "A project",
      order: 1,
      milestones: [],
    });
    await createProject({
      id: uid("p"),
      skillId: "SKILL_B",
      relatedSkillIds: ["SKILL_B"],
      title: "B project",
      order: 2,
      milestones: [],
    });
    await createProject({
      id: uid("p"),
      skillId: "SKILL_C",
      relatedSkillIds: ["SKILL_C"],
      title: "C project",
      order: 3,
      milestones: [],
    });

    const matches = await getProjectsBySkillIds(["SKILL_A", "SKILL_C"], userId);
    expect(matches.map((project) => project.title).sort()).toEqual([
      "A project",
      "C project",
    ]);
  });

  it("returns no projects when the skill list is empty", async () => {
    userId = await createUser();
    expect(await getProjectsBySkillIds([], userId)).toEqual([]);
  });

  it("loads a project detail with milestones, notes and primary skill", async () => {
    userId = await createUser();
    await createSkill("SKILL_A");
    await createSkill("SKILL_B");
    const projectId = uid("p");
    await createProject({
      id: projectId,
      skillId: "SKILL_A",
      relatedSkillIds: ["SKILL_A", "SKILL_B"],
      title: "Build it",
      order: 1,
      milestones: ["Plan", "Code", "Polish"],
    });
    await prisma.userProject.create({
      data: {
        userId,
        projectId,
        startedAt: new Date(),
        notes: "my private notes",
      },
    });

    const detail = await getProject(projectId, userId);
    expect(detail).not.toBeNull();
    expect(detail!.primarySkill).toEqual({ id: "SKILL_A", name: "SKILL_A" });
    expect(detail!.skills.map((skill) => skill.id)).toEqual(["SKILL_A", "SKILL_B"]);
    expect(detail!.milestones.map((milestone) => milestone.title)).toEqual([
      "Plan",
      "Code",
      "Polish",
    ]);
    expect(detail!.notes).toBe("my private notes");
    expect(detail!.status).toBe("in-progress");
    expect(detail!.progress.total).toBe(3);
  });

  it("returns null for an unknown project", async () => {
    userId = await createUser();
    expect(await getProject(uid("missing"), userId)).toBeNull();
  });

  it("reflects milestone completions in progress and status", async () => {
    userId = await createUser();
    await createSkill("SKILL_A");
    const projectId = uid("p");
    await createProject({
      id: projectId,
      skillId: "SKILL_A",
      relatedSkillIds: ["SKILL_A"],
      title: "Milestones",
      order: 1,
      milestones: ["One", "Two"],
    });
    await prisma.userProject.create({ data: { userId, projectId, startedAt: new Date() } });
    await prisma.projectMilestoneProgress.create({
      data: { userId, projectId, milestoneIndex: 0, completedAt: new Date() },
    });

    const detail = await getProject(projectId, userId);
    expect(detail!.progress.completed).toBe(1);
    expect(detail!.milestones[0].completed).toBe(true);
    expect(detail!.milestones[1].completed).toBe(false);
    expect(detail!.status).toBe("in-progress");
  });

  it("links lessons, exercises and courses as resources for a project", async () => {
    userId = await createUser();
    await createSkill("SKILL_A");
    const lessonId = await createLesson("SKILL_A");
    const exerciseId = await createExercise("SKILL_A");
    await createCourse("SKILL_A");
    const projectId = uid("p");
    await createProject({
      id: projectId,
      skillId: "SKILL_A",
      relatedSkillIds: ["SKILL_A"],
      title: "Resources",
      order: 1,
      milestones: [],
    });

    const detail = await getProject(projectId, userId);
    expect(detail!.resources.lessons.map((lesson) => lesson.id)).toContain(lessonId);
    expect(detail!.resources.lessons[0].skillName).toBe("SKILL_A");
    expect(detail!.resources.exercises.map((exercise) => exercise.id)).toContain(exerciseId);
    expect(detail!.resources.courses).toHaveLength(1);
  });

  it("returns an empty dashboard when the user has no projects", async () => {
    userId = await createUser();
    const dashboard = await getDashboardProjects(userId);
    expect(dashboard.current).toBeNull();
    expect(dashboard.recommended).toBeNull();
    expect(dashboard.completed).toEqual([]);
    expect(dashboard.completedCount).toBe(0);
  });

  it("surfaces an in-progress project as the current dashboard project", async () => {
    userId = await createUser();
    await createSkill("SKILL_A");
    const projectId = uid("p");
    await createProject({
      id: projectId,
      skillId: "SKILL_A",
      relatedSkillIds: ["SKILL_A"],
      title: "In progress",
      order: 1,
      milestones: ["One", "Two"],
    });
    await prisma.userProject.create({
      data: { userId, projectId, startedAt: new Date() },
    });

    const dashboard = await getDashboardProjects(userId);
    expect(dashboard.current?.title).toBe("In progress");
    expect(dashboard.current?.status).toBe("in-progress");
  });

  it("reports completed projects in the dashboard and progress list", async () => {
    userId = await createUser();
    await createSkill("SKILL_A");
    const projectId = uid("p");
    await createProject({
      id: projectId,
      skillId: "SKILL_A",
      relatedSkillIds: ["SKILL_A"],
      title: "Done",
      order: 1,
      milestones: [],
    });
    await prisma.userProject.create({
      data: { userId, projectId, startedAt: new Date(), completed: true, completedAt: new Date() },
    });

    const dashboard = await getDashboardProjects(userId);
    expect(dashboard.completedCount).toBe(1);
    expect(dashboard.completed[0].title).toBe("Done");

    const progress = await getProgressProjects(userId);
    expect(progress).toHaveLength(1);
    expect(progress[0].status).toBe("completed");
  });

  it("excludes untouched projects from the progress list", async () => {
    userId = await createUser();
    await createSkill("SKILL_A");
    await createProject({
      id: uid("p"),
      skillId: "SKILL_A",
      relatedSkillIds: ["SKILL_A"],
      title: "Untouched",
      order: 1,
      milestones: [],
    });

    expect(await getProgressProjects(userId)).toEqual([]);
  });
});

describe("project actions (authentication guards)", () => {
  it("startProject rejects an anonymous user", async () => {
    expect(await startProject("ANY")).toEqual({ error: "Not signed in" });
  });

  it("toggleProjectMilestone rejects an anonymous user", async () => {
    expect(await toggleProjectMilestone("ANY", 0)).toEqual({ error: "Not signed in" });
  });

  it("toggleProjectCompletion rejects an anonymous user", async () => {
    expect(await toggleProjectCompletion("ANY")).toEqual({ error: "Not signed in" });
  });

  it("saveProjectNotes rejects an anonymous user", async () => {
    expect(await saveProjectNotes("ANY", "notes")).toEqual({ error: "Not signed in" });
  });
});

describe("project actions", () => {
  it("starts a project once and is idempotent on repeat", async () => {
    userId = await createUser();
    await createSkill("SKILL_A");
    const projectId = uid("p");
    await createProject({
      id: projectId,
      skillId: "SKILL_A",
      relatedSkillIds: ["SKILL_A"],
      title: "Start me",
      order: 1,
      milestones: [],
    });
    authMock.mockResolvedValue({ user: { id: userId } } as never);

    const first = await startProject(projectId);
    expect(first.result?.started).toBe(true);
    const second = await startProject(projectId);
    expect(second.result?.started).toBe(false);

    const record = await prisma.userProject.findUnique({
      where: { userId_projectId: { userId, projectId } },
    });
    expect(record).not.toBeNull();
    expect(record!.startedAt).not.toBeNull();
  });

  it("startProject rejects an unknown project", async () => {
    userId = await createUser();
    authMock.mockResolvedValue({ user: { id: userId } } as never);
    expect(await startProject(uid("missing"))).toEqual({ error: "Project not found" });
  });

  it("toggleProjectMilestone rejects an out-of-range milestone", async () => {
    userId = await createUser();
    await createSkill("SKILL_A");
    const projectId = uid("p");
    await createProject({
      id: projectId,
      skillId: "SKILL_A",
      relatedSkillIds: ["SKILL_A"],
      title: "Bounds",
      order: 1,
      milestones: ["Only one"],
    });
    authMock.mockResolvedValue({ user: { id: userId } } as never);

    expect(await toggleProjectMilestone(projectId, 7)).toEqual({
      error: "Invalid milestone",
    });
  });

  it("completing the final milestone marks the project done", async () => {
    userId = await createUser();
    await createSkill("SKILL_A");
    const projectId = uid("p");
    await createProject({
      id: projectId,
      skillId: "SKILL_A",
      relatedSkillIds: ["SKILL_A"],
      title: "Finish me",
      order: 1,
      milestones: ["One", "Two"],
    });
    authMock.mockResolvedValue({ user: { id: userId } } as never);

    await toggleProjectMilestone(projectId, 0);
    const partial = await prisma.userProject.findUnique({
      where: { userId_projectId: { userId, projectId } },
    });
    expect(partial?.completed).toBe(false);

    const last = await toggleProjectMilestone(projectId, 1);
    expect(last.result?.completed).toBe(true);
    expect(last.result?.projectCompleted).toBe(true);
    expect(last.result?.progress.done).toBe(true);

    const record = await prisma.userProject.findUnique({
      where: { userId_projectId: { userId, projectId } },
    });
    expect(record?.completed).toBe(true);
    expect(record?.completedAt).not.toBeNull();
  });

  it("un-checking a milestone reopens the project", async () => {
    userId = await createUser();
    await createSkill("SKILL_A");
    const projectId = uid("p");
    await createProject({
      id: projectId,
      skillId: "SKILL_A",
      relatedSkillIds: ["SKILL_A"],
      title: "Reopen me",
      order: 1,
      milestones: ["One", "Two"],
    });
    authMock.mockResolvedValue({ user: { id: userId } } as never);

    await toggleProjectMilestone(projectId, 0);
    await toggleProjectMilestone(projectId, 1);
    const reopened = await toggleProjectMilestone(projectId, 1);
    expect(reopened.result?.completed).toBe(false);
    expect(reopened.result?.projectCompleted).toBe(false);

    const record = await prisma.userProject.findUnique({
      where: { userId_projectId: { userId, projectId } },
    });
    expect(record?.completed).toBe(false);
    expect(record?.completedAt).toBeNull();
  });

  it("toggleProjectCompletion toggles manual completion on and off", async () => {
    userId = await createUser();
    await createSkill("SKILL_A");
    const projectId = uid("p");
    await createProject({
      id: projectId,
      skillId: "SKILL_A",
      relatedSkillIds: ["SKILL_A"],
      title: "Manual",
      order: 1,
      milestones: [],
    });
    authMock.mockResolvedValue({ user: { id: userId } } as never);

    const on = await toggleProjectCompletion(projectId);
    expect(on.result?.completed).toBe(true);
    expect(on.result?.completedAt).not.toBeNull();

    const off = await toggleProjectCompletion(projectId);
    expect(off.result?.completed).toBe(false);
  });

  it("saveProjectNotes persists notes and truncates very long input", async () => {
    userId = await createUser();
    await createSkill("SKILL_A");
    const projectId = uid("p");
    await createProject({
      id: projectId,
      skillId: "SKILL_A",
      relatedSkillIds: ["SKILL_A"],
      title: "Notes",
      order: 1,
      milestones: [],
    });
    authMock.mockResolvedValue({ user: { id: userId } } as never);

    const longNotes = "a".repeat(6000);
    expect(await saveProjectNotes(projectId, longNotes)).toEqual({});

    const record = await prisma.userProject.findUnique({
      where: { userId_projectId: { userId, projectId } },
    });
    expect(record?.notes).toHaveLength(5000);
  });
});
