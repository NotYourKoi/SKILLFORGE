import { prisma } from "@/lib/db";
import { getCompletedSkillIds, getSkillGraph } from "@/lib/queries";
import { deriveStatuses, type SkillStatus } from "@/lib/roadmap";

export interface CourseProgress {
  total: number;
  completed: number;
  percent: number;
  done: boolean;
}

export interface CourseSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  estimatedMinutes: number;
  moduleCount: number;
  skillCount: number;
  progress: CourseProgress | null;
}

export interface CourseDetailSkill {
  id: string;
  name: string;
  description: string;
  difficulty: string;
  status: SkillStatus | null;
}

export interface CourseDetailModule {
  id: string;
  title: string;
  description: string;
  order: number;
  objectives: string[];
  skills: CourseDetailSkill[];
}

export interface CourseDetail {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  estimatedMinutes: number;
  objectives: string[];
  modules: CourseDetailModule[];
  progress: CourseProgress | null;
  externalPrerequisites: { id: string; name: string }[];
}

function parseList(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Pure: how many of the course's skills the user has completed. */
export function computeCourseProgress(
  completed: Set<string>,
  courseSkillIds: string[],
): CourseProgress {
  const total = courseSkillIds.length;
  if (total === 0) return { total: 0, completed: 0, percent: 0, done: false };
  const doneCount = courseSkillIds.filter((id) => completed.has(id)).length;
  return {
    total,
    completed: doneCount,
    percent: Math.round((doneCount / total) * 100),
    done: doneCount === total,
  };
}

export async function getCourses(userId: string | null): Promise<CourseSummary[]> {
  const [courses, completed] = await Promise.all([
    prisma.course.findMany({
      orderBy: [{ category: "asc" }, { title: "asc" }],
      include: { modules: { select: { id: true, skills: { select: { id: true } } } } },
    }),
    userId ? getCompletedSkillIds(userId) : Promise.resolve(new Set<string>()),
  ]);

  return courses.map((course) => {
    const skillIds = [...new Set(course.modules.flatMap((m) => m.skills.map((s) => s.id)))];
    return {
      id: course.id,
      slug: course.slug,
      title: course.title,
      description: course.description,
      category: course.category,
      difficulty: course.difficulty,
      estimatedMinutes: course.estimatedMinutes,
      moduleCount: course.modules.length,
      skillCount: skillIds.length,
      progress: userId ? computeCourseProgress(completed, skillIds) : null,
    };
  });
}

export async function getCourseBySlug(
  slug: string,
  userId: string | null,
): Promise<CourseDetail | null> {
  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: { skills: { orderBy: { name: "asc" } } },
      },
    },
  });
  if (!course) return null;

  const courseSkillIds = [...new Set(course.modules.flatMap((m) => m.skills.map((s) => s.id)))];

  const [graph, completed, allSkills] = await Promise.all([
    getSkillGraph(),
    userId ? getCompletedSkillIds(userId) : Promise.resolve(new Set<string>()),
    prisma.skill.findMany({ select: { id: true, name: true } }),
  ]);
  const nameById = new Map(allSkills.map((s) => [s.id, s.name]));
  const statuses = userId ? deriveStatuses(graph, completed) : new Map<string, SkillStatus>();

  const externalPrereqIds = new Set<string>();
  for (const node of graph) {
    if (!courseSkillIds.includes(node.id)) continue;
    for (const prereqId of node.prereqIds) {
      if (!courseSkillIds.includes(prereqId)) externalPrereqIds.add(prereqId);
    }
  }
  const externalPrerequisites = [...externalPrereqIds]
    .sort()
    .map((id) => ({ id, name: nameById.get(id) ?? id }));

  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: course.description,
    category: course.category,
    difficulty: course.difficulty,
    estimatedMinutes: course.estimatedMinutes,
    objectives: parseList(course.objectives),
    modules: course.modules.map((mod) => ({
      id: mod.id,
      title: mod.title,
      description: mod.description,
      order: mod.order,
      objectives: parseList(mod.objectives),
      skills: mod.skills.map((skill) => ({
        id: skill.id,
        name: skill.name,
        description: skill.description,
        difficulty: skill.difficulty,
        status: userId ? (statuses.get(skill.id) ?? null) : null,
      })),
    })),
    progress: userId ? computeCourseProgress(completed, courseSkillIds) : null,
    externalPrerequisites,
  };
}
