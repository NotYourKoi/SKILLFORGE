import { prisma } from "@/lib/db";
import { getCompletedSkillIds, getSkillGraph } from "@/lib/queries";
import { deriveStatuses } from "@/lib/roadmap";

export type ProjectStatus = "not-started" | "in-progress" | "completed";

export interface ProjectProgress {
  completed: number;
  total: number;
  percent: number;
  done: boolean;
}

export interface ProjectSkillView {
  id: string;
  name: string;
}

export interface ProjectSummary {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  estimatedMinutes: number;
  order: number;
  skills: ProjectSkillView[];
  status: ProjectStatus;
  progress: ProjectProgress;
  startedAt: Date | null;
  completedAt: Date | null;
}

export interface ProjectMilestoneView {
  index: number;
  title: string;
  completed: boolean;
  completedAt: Date | null;
}

export interface ProjectResources {
  lessons: { id: string; title: string; skillId: string; skillName: string }[];
  exercises: { id: string; title: string; skillId: string }[];
  courses: { id: string; title: string; slug: string }[];
}

export interface ProjectDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  estimatedMinutes: number;
  order: number;
  primarySkill: ProjectSkillView;
  skills: ProjectSkillView[];
  objectives: string[];
  requirements: string[];
  hints: string[];
  expectedOutput: string;
  milestones: ProjectMilestoneView[];
  progress: ProjectProgress;
  status: ProjectStatus;
  startedAt: Date | null;
  completedAt: Date | null;
  notes: string;
  resources: ProjectResources;
}

/** Pure: milestone progress + whether the project is done. */
export function computeProjectProgress(
  total: number,
  completed: number,
): ProjectProgress {
  if (total <= 0) return { completed: 0, total: 0, percent: 0, done: false };
  const percent = Math.round((completed / total) * 100);
  return { completed, total, percent, done: completed === total };
}

function deriveStatus(
  userProject: { completed: boolean; startedAt: Date | null } | null,
  progress: ProjectProgress,
): ProjectStatus {
  if (userProject?.completed) return "completed";
  if (progress.completed > 0 || userProject?.startedAt) return "in-progress";
  return "not-started";
}

function parseList(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

interface LoadedUserProject {
  userId: string;
  projectId: string;
  startedAt: Date | null;
  notes: string;
  completed: boolean;
  completedAt: Date | null;
}

function parseMilestones(raw: string): string[] {
  return parseList(raw);
}

async function loadUserProjects(
  userId: string,
  projectIds: string[],
): Promise<Map<string, LoadedUserProject>> {
  if (projectIds.length === 0) return new Map();
  const rows = await prisma.userProject.findMany({
    where: { userId, projectId: { in: projectIds } },
  });
  return new Map(rows.map((row) => [row.projectId, row]));
}

async function loadMilestoneProgress(
  userId: string,
  projectIds: string[],
): Promise<Map<string, Set<number>>> {
  if (projectIds.length === 0) return new Map();
  const rows = await prisma.projectMilestoneProgress.findMany({
    where: { userId, projectId: { in: projectIds } },
  });
  const map = new Map<string, Set<number>>();
  for (const row of rows) {
    if (!map.has(row.projectId)) map.set(row.projectId, new Set());
    map.get(row.projectId)!.add(row.milestoneIndex);
  }
  return map;
}

function summarize(
  project: {
    id: string;
    title: string;
    description: string;
    category: string;
    difficulty: string;
    estimatedMinutes: number;
    order: number;
    skills: { skill: ProjectSkillView }[];
  },
  userProject: LoadedUserProject | null,
  completedMilestones: Set<number>,
  totalMilestones: number,
): ProjectSummary {
  const progress = computeProjectProgress(totalMilestones, completedMilestones.size);
  return {
    id: project.id,
    title: project.title,
    description: project.description,
    category: project.category,
    difficulty: project.difficulty,
    estimatedMinutes: project.estimatedMinutes,
    order: project.order,
    skills: project.skills.map((link) => link.skill),
    status: deriveStatus(userProject, progress),
    progress,
    startedAt: userProject?.startedAt ?? null,
    completedAt: userProject?.completedAt ?? null,
  };
}

export async function getProjects(userId: string): Promise<ProjectSummary[]> {
  const projects = await prisma.project.findMany({
    orderBy: [{ order: "asc" }, { title: "asc" }],
    include: {
      skills: { include: { skill: { select: { id: true, name: true } } } },
    },
  });
  const ids = projects.map((project) => project.id);
  const [userProjects, milestoneProgress] = await Promise.all([
    loadUserProjects(userId, ids),
    loadMilestoneProgress(userId, ids),
  ]);

  return projects.map((project) => {
    const milestoneCount = parseMilestones(project.milestones).length;
    return summarize(
      project,
      userProjects.get(project.id) ?? null,
      milestoneProgress.get(project.id) ?? new Set(),
      milestoneCount,
    );
  });
}

export async function getProjectsBySkill(
  skillId: string,
  userId: string,
): Promise<ProjectSummary[]> {
  const projects = await prisma.project.findMany({
    where: { skills: { some: { skillId } } },
    orderBy: [{ order: "asc" }, { title: "asc" }],
    include: {
      skills: { include: { skill: { select: { id: true, name: true } } } },
    },
  });
  const ids = projects.map((project) => project.id);
  const [userProjects, milestoneProgress] = await Promise.all([
    loadUserProjects(userId, ids),
    loadMilestoneProgress(userId, ids),
  ]);

  return projects.map((project) => {
    const milestoneCount = parseMilestones(project.milestones).length;
    return summarize(
      project,
      userProjects.get(project.id) ?? null,
      milestoneProgress.get(project.id) ?? new Set(),
      milestoneCount,
    );
  });
}

export async function getProjectsBySkillIds(
  skillIds: string[],
  userId: string,
): Promise<ProjectSummary[]> {
  if (skillIds.length === 0) return [];
  const projects = await prisma.project.findMany({
    where: { skills: { some: { skillId: { in: skillIds } } } },
    orderBy: [{ order: "asc" }, { title: "asc" }],
    include: {
      skills: { include: { skill: { select: { id: true, name: true } } } },
    },
  });
  const ids = projects.map((project) => project.id);
  const [userProjects, milestoneProgress] = await Promise.all([
    loadUserProjects(userId, ids),
    loadMilestoneProgress(userId, ids),
  ]);

  return projects.map((project) => {
    const milestoneCount = parseMilestones(project.milestones).length;
    return summarize(
      project,
      userProjects.get(project.id) ?? null,
      milestoneProgress.get(project.id) ?? new Set(),
      milestoneCount,
    );
  });
}

async function getResources(relatedSkillIds: string[]): Promise<ProjectResources> {
  if (relatedSkillIds.length === 0) {
    return { lessons: [], exercises: [], courses: [] };
  }
  const [lessons, exercises, courses] = await Promise.all([
    prisma.lesson.findMany({
      where: { skillId: { in: relatedSkillIds } },
      orderBy: [{ skillId: "asc" }, { order: "asc" }],
      select: { id: true, title: true, skillId: true, skill: { select: { name: true } } },
    }),
    prisma.exercise.findMany({
      where: { skillId: { in: relatedSkillIds } },
      orderBy: [{ skillId: "asc" }, { order: "asc" }],
      select: { id: true, title: true, skillId: true },
    }),
    prisma.course.findMany({
      where: { modules: { some: { skills: { some: { id: { in: relatedSkillIds } } } } } },
      orderBy: { title: "asc" },
      select: { id: true, title: true, slug: true },
    }),
  ]);

  return {
    lessons: lessons.slice(0, 6).map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      skillId: lesson.skillId,
      skillName: lesson.skill.name,
    })),
    exercises: exercises.slice(0, 6).map((exercise) => ({
      id: exercise.id,
      title: exercise.title,
      skillId: exercise.skillId,
    })),
    courses,
  };
}

export async function getProject(
  projectId: string,
  userId: string,
): Promise<ProjectDetail | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      skill: { select: { name: true } },
      skills: {
        orderBy: { skillId: "asc" },
        include: { skill: { select: { id: true, name: true } } },
      },
    },
  });
  if (!project) return null;

  const [userProject, milestoneProgress] = await Promise.all([
    prisma.userProject.findUnique({
      where: { userId_projectId: { userId, projectId } },
    }),
    prisma.projectMilestoneProgress.findMany({ where: { userId, projectId } }),
  ]);

  const milestones = parseMilestones(project.milestones);
  const completedIndexes = new Set(milestoneProgress.map((m) => m.milestoneIndex));
  const progress = computeProjectProgress(milestones.length, completedIndexes.size);

  const milestoneViews: ProjectMilestoneView[] = milestones.map((title, index) => {
    const record = milestoneProgress.find((m) => m.milestoneIndex === index);
    return {
      index,
      title,
      completed: completedIndexes.has(index),
      completedAt: record?.completedAt ?? null,
    };
  });

  const relatedSkillIds = project.skills.map((link) => link.skillId);
  const resources = await getResources(relatedSkillIds);

  return {
    id: project.id,
    title: project.title,
    description: project.description,
    category: project.category,
    difficulty: project.difficulty,
    estimatedMinutes: project.estimatedMinutes,
    order: project.order,
    primarySkill: { id: project.skillId, name: project.skill?.name ?? project.skillId },
    skills: project.skills.map((link) => ({ id: link.skillId, name: link.skill.name })),
    objectives: parseList(project.objectives),
    requirements: parseList(project.requirements),
    hints: parseList(project.hints),
    expectedOutput: project.expectedOutput,
    milestones: milestoneViews,
    progress,
    status: deriveStatus(userProject, progress),
    startedAt: userProject?.startedAt ?? null,
    completedAt: userProject?.completedAt ?? null,
    notes: userProject?.notes ?? "",
    resources,
  };
}

export interface DashboardProjects {
  current: ProjectSummary | null;
  recent: ProjectSummary[];
  completed: ProjectSummary[];
  recommended: ProjectSummary | null;
  completedCount: number;
}

export async function getDashboardProjects(userId: string): Promise<DashboardProjects> {
  const all = await getProjects(userId);
  if (all.length === 0) {
    return { current: null, recent: [], completed: [], recommended: null, completedCount: 0 };
  }

  const inProgress = all
    .filter((project) => project.status === "in-progress")
    .sort((a, b) => (b.startedAt?.getTime() ?? 0) - (a.startedAt?.getTime() ?? 0));
  const completed = all
    .filter((project) => project.status === "completed")
    .sort((a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0));
  const untouched = all.filter((project) => project.status === "not-started");

  const completedIds = new Set(completed.map((project) => project.id));
  const currentId = inProgress[0]?.id;
  const recent = all
    .filter(
      (project) =>
        project.id !== currentId &&
        !completedIds.has(project.id) &&
        project.startedAt !== null,
    )
    .sort((a, b) => (b.startedAt?.getTime() ?? 0) - (a.startedAt?.getTime() ?? 0))
    .slice(0, 3);

  const current = inProgress[0] ?? null;

  let recommended: ProjectSummary | null = null;
  if (untouched.length > 0) {
    const [completedSkillIds, graph] = await Promise.all([
      getCompletedSkillIds(userId),
      getSkillGraph(),
    ]);
    const statuses = deriveStatuses(graph, completedSkillIds);
    recommended =
      untouched.find(
        (project) =>
          statuses.get(project.skills[0]?.id ?? "") === "UNLOCKED" ||
          statuses.get(project.skills[0]?.id ?? "") === "COMPLETED",
      ) ?? untouched[0];
  }

  return {
    current,
    recent,
    completed: completed.slice(0, 3),
    completedCount: completed.length,
    recommended,
  };
}

export interface ProgressProjectView {
  id: string;
  title: string;
  status: ProjectStatus;
  progress: ProjectProgress;
  completedAt: Date | null;
}

/** Compact project summary for the progress page. */
export async function getProgressProjects(userId: string): Promise<ProgressProjectView[]> {
  const all = await getProjects(userId);
  return all
    .filter((project) => project.status !== "not-started")
    .sort((a, b) => (b.completedAt?.getTime() ?? b.startedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? a.startedAt?.getTime() ?? 0))
    .map((project) => ({
      id: project.id,
      title: project.title,
      status: project.status,
      progress: project.progress,
      completedAt: project.completedAt,
    }));
}
