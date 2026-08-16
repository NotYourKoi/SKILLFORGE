import { prisma } from "@/lib/db";
import { getCompletedSkillIds } from "@/lib/queries";
import { deriveStatuses, type SkillStatus } from "@/lib/roadmap";

/**
 * Phase H — learning path.
 *
 * Presents a course as an ordered series of skills grouped by module, each with
 * a status derived deterministically from the prerequisite graph:
 *
 *   COMPLETED — the skill is marked done.
 *   LOCKED    — at least one prerequisite skill is not yet completed.
 *   NEXT      — prerequisites satisfied, first available skill in course order.
 *   CURRENT   — prerequisites satisfied but not the immediate next step.
 *
 * Unmet prerequisites are listed per skill (even when they belong to another
 * course), so the learner can see exactly what is blocking progress.
 */

export type PathStatus = "COMPLETED" | "CURRENT" | "NEXT" | "LOCKED";

export interface PathSkill {
  skillId: string;
  skillName: string;
  status: PathStatus;
  prerequisites: { skillId: string; skillName: string; satisfied: boolean }[];
}

export interface PathModule {
  id: string;
  title: string;
  order: number;
  skills: PathSkill[];
}

export interface LearningPath {
  courseId: string;
  courseTitle: string;
  modules: PathModule[];
  completed: number;
  total: number;
}

export interface LearningPathInput {
  courseId: string;
  courseTitle: string;
  modules: { id: string; title: string; order: number; skillIds: string[] }[];
  statuses: ReadonlyMap<string, SkillStatus>;
  prereqs: Map<string, string[]>;
  skillNames: Map<string, string>;
}

/** Pure core — deterministic, unit-testable. */
export function buildPath(input: LearningPathInput): LearningPath {
  const modules: PathModule[] = [];
  let nextAssigned = false;
  let completed = 0;
  let total = 0;

  for (const mod of [...input.modules].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))) {
    const skills: PathSkill[] = [];
    for (const skillId of mod.skillIds) {
      total += 1;
      const status = input.statuses.get(skillId);
      const prerequisites = (input.prereqs.get(skillId) ?? [])
        .map((prereqId) => ({
          skillId: prereqId,
          skillName: input.skillNames.get(prereqId) ?? prereqId,
          satisfied: input.statuses.get(prereqId) === "COMPLETED",
        }))
        .sort((a, b) => a.skillName.localeCompare(b.skillName));

      let pathStatus: PathStatus;
      if (status === "COMPLETED") {
        pathStatus = "COMPLETED";
        completed += 1;
      } else if (!prerequisites.every((prereq) => prereq.satisfied)) {
        pathStatus = "LOCKED";
      } else if (!nextAssigned) {
        pathStatus = "NEXT";
        nextAssigned = true;
      } else {
        pathStatus = "CURRENT";
      }

      skills.push({ skillId, skillName: input.skillNames.get(skillId) ?? skillId, status: pathStatus, prerequisites });
    }
    modules.push({ id: mod.id, title: mod.title, order: mod.order, skills });
  }

  return { courseId: input.courseId, courseTitle: input.courseTitle, modules, completed, total };
}

/** DB-backed facade for a course's learning path for one user. */
export async function getLearningPath(userId: string, courseId: string): Promise<LearningPath | null> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: { skills: { orderBy: { name: "asc" } } },
      },
    },
  });
  if (!course) return null;

  const [skills, prereqRows, completed] = await Promise.all([
    prisma.skill.findMany({ select: { id: true, name: true } }),
    prisma.prerequisite.findMany(),
    getCompletedSkillIds(userId),
  ]);

  const skillNames = new Map(skills.map((skill) => [skill.id, skill.name]));
  const prereqs = new Map<string, string[]>();
  for (const row of prereqRows) {
    const list = prereqs.get(row.skillId) ?? [];
    list.push(row.prereqId);
    prereqs.set(row.skillId, list);
  }

  const graph = skills.map((skill) => ({ id: skill.id, prereqIds: prereqs.get(skill.id) ?? [] }));
  const statuses = deriveStatuses(graph, completed);

  return buildPath({
    courseId: course.id,
    courseTitle: course.title,
    modules: course.modules.map((module) => ({
      id: module.id,
      title: module.title,
      order: module.order,
      skillIds: module.skills.map((skill) => skill.id),
    })),
    statuses,
    prereqs,
    skillNames,
  });
}
