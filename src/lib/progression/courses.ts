import { prisma } from "@/lib/db";
import { getCompletedSkillIds } from "@/lib/queries";
import { awardXp } from "./xp";

export interface CourseProgressView {
  id: string;
  slug: string;
  title: string;
  completedSkillIds: number;
  totalSkillIds: number;
  percent: number;
  completed: boolean;
}

/** Skills required by a course (all unique skill ids across its modules). */
export async function getCourseSkillIds(): Promise<Map<string, string[]>> {
  const courses = await prisma.course.findMany({
    include: { modules: { include: { skills: { select: { id: true } } } } },
  });
  const map = new Map<string, string[]>();
  for (const course of courses) {
    const ids = [...new Set(course.modules.flatMap((mod) => mod.skills.map((s) => s.id)))];
    map.set(course.id, ids);
  }
  return map;
}

/** Ids of courses whose every required skill is complete. */
export async function getCompletedCourseIds(userId: string): Promise<Set<string>> {
  const [completedSkills, courseSkillIds] = await Promise.all([
    getCompletedSkillIds(userId),
    getCourseSkillIds(),
  ]);
  const completedCourses = new Set<string>();
  for (const [courseId, skillIds] of courseSkillIds) {
    if (skillIds.length > 0 && skillIds.every((id) => completedSkills.has(id))) {
      completedCourses.add(courseId);
    }
  }
  return completedCourses;
}

/** Progress for every course, derived from the skills the user has completed. */
export async function getCourseProgress(userId: string): Promise<CourseProgressView[]> {
  const [completedSkills, courseSkillIds, courses] = await Promise.all([
    getCompletedSkillIds(userId),
    getCourseSkillIds(),
    prisma.course.findMany({
      orderBy: { title: "asc" },
      select: { id: true, slug: true, title: true },
    }),
  ]);

  return courses
    .map((course) => {
      const skillIds = courseSkillIds.get(course.id) ?? [];
      const completedSkillIds = skillIds.filter((id) => completedSkills.has(id)).length;
      return {
        id: course.id,
        slug: course.slug,
        title: course.title,
        completedSkillIds,
        totalSkillIds: skillIds.length,
        percent:
          skillIds.length === 0 ? 0 : Math.round((completedSkillIds / skillIds.length) * 100),
        completed:
          skillIds.length > 0 && skillIds.every((id) => completedSkills.has(id)),
      };
    })
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return b.percent - a.percent;
    });
}

/**
 * Awards COURSE_COMPLETED XP for every course the user has just (conceptually)
 * completed. Idempotent per course via the XpEvent unique key. Returns the
 * ids of courses whose XP was newly awarded.
 */
export async function awardCourseCompletionXp(userId: string): Promise<string[]> {
  const completedCourseIds = await getCompletedCourseIds(userId);
  const newlyCompleted: string[] = [];
  for (const courseId of completedCourseIds) {
    const result = await awardXp(userId, "COURSE_COMPLETED", courseId);
    if (result.awarded) newlyCompleted.push(courseId);
  }
  return newlyCompleted;
}
