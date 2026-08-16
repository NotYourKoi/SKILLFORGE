import { prisma } from "@/lib/db";
import { getCompletedSkillIds } from "@/lib/queries";
import { deriveStatuses, type SkillStatus } from "@/lib/roadmap";

/**
 * Phase H — deterministic recommendation engine.
 *
 * Never uses an LLM. Ranking is a pure function over the prerequisite graph,
 * completion state, course/module relationships and the user's goals, so it is
 * explainable and unit-testable. Priority (higher score wins):
 *
 *   1. Continue unfinished content the user already started (project/lesson)
 *   2. Next unlocked skill in the roadmap
 *   3. Next skill toward the user's selected goal course
 *   4. Unmet prerequisite of a goal skill (external prerequisites surfaced)
 *   5. Practice exercises for accessible skills
 *   6. Relevant project once its required skills are accessible
 */

export interface Recommendation {
  type: "lesson" | "skill" | "exercise" | "project";
  id: string;
  title: string;
  description: string;
  href: string;
  reason: string;
  score: number;
  context?: { skillId: string; skillName: string };
}

export interface RecommendationState {
  skills: { id: string; name: string; description: string }[];
  skillPrereqs: Map<string, string[]>;
  statuses: ReadonlyMap<string, SkillStatus>;
  lessons: { id: string; title: string; skillId: string }[];
  lessonProgress: { lessonId: string; completed: boolean }[];
  exercises: { id: string; title: string; difficulty: string; skillId: string }[];
  exerciseProgress: { exerciseId: string; solved: boolean }[];
  projects: { id: string; title: string; category: string; skillIds: string[] }[];
  projectProgress: { projectId: string; started: boolean; completed: boolean }[];
  goals: { courseId: string | null }[];
  courseSkills: Map<string, string[]>;
  courseNames: Map<string, string>;
}

const SCORE = {
  CONTINUE_PROJECT: 100,
  CONTINUE_LESSON: 96,
  NEXT_SKILL: 90,
  GOAL: 80,
  GOAL_PREREQ: 75,
  PRACTICE: 70,
  PROJECT_READY: 60,
  PROJECT_ALL_DONE: 66,
};

/**
 * Deterministic topological ordering (prerequisites before dependents) with an
 * alphabetical tie-break, so results never depend on DB row order.
 */
export function topologicalOrder(
  skills: { id: string }[],
  prereqs: Map<string, string[]>,
): string[] {
  const order: string[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  const visit = (id: string): void => {
    if (visited.has(id) || visiting.has(id)) return;
    visiting.add(id);
    for (const prereqId of prereqs.get(id) ?? []) visit(prereqId);
    visiting.delete(id);
    visited.add(id);
    order.push(id);
  };

  const sorted = [...skills].sort((a, b) => a.id.localeCompare(b.id));
  for (const skill of sorted) visit(skill.id);
  return order;
}

/** Next unfinished lesson for a skill, in lesson order, or null. */
function nextLessonOf(
  skillId: string,
  lessonsBySkill: Map<string, { id: string; title: string }[]>,
  progressByLesson: Map<string, boolean>,
): { id: string; title: string } | null {
  const list = lessonsBySkill.get(skillId) ?? [];
  for (const lesson of list) {
    if (!progressByLesson.get(lesson.id)) return { id: lesson.id, title: lesson.title };
  }
  return null;
}

function hasLessonProgress(
  skillId: string,
  lessonsBySkill: Map<string, { id: string; title: string }[]>,
  progressByLesson: Map<string, boolean>,
): boolean {
  return (lessonsBySkill.get(skillId) ?? []).some((lesson) =>
    progressByLesson.has(lesson.id),
  );
}

/**
 * Walk the prerequisite graph of `skillId` and return the nearest actionable
 * unlocked prerequisite (deepest-first, deterministic). Returns null when the
 * skill has no unmet unlocked prerequisite.
 */
export function findUnmetPrereq(
  skillId: string,
  prereqs: Map<string, string[]>,
  statuses: ReadonlyMap<string, SkillStatus>,
): string | null {
  const stack = [...(prereqs.get(skillId) ?? [])].sort();
  const visited = new Set<string>();
  while (stack.length) {
    const prereqId = stack.shift()!;
    if (visited.has(prereqId)) continue;
    visited.add(prereqId);
    const status = statuses.get(prereqId);
    if (status === "UNLOCKED") return prereqId;
    if (status === "LOCKED") {
      stack.push(...(prereqs.get(prereqId) ?? []));
    }
  }
  return null;
}

/**
 * Pure ranking core. Inputs fully describe the user's progress + the catalog;
 * the result is deterministic and stable.
 */
export function rankRecommendations(state: RecommendationState): Recommendation[] {
  const order = topologicalOrder(state.skills, state.skillPrereqs);
  const nameById = new Map(state.skills.map((skill) => [skill.id, skill.name]));
  const descById = new Map(state.skills.map((skill) => [skill.id, skill.description]));

  const lessonsBySkill = new Map<string, { id: string; title: string }[]>();
  for (const lesson of state.lessons) {
    const list = lessonsBySkill.get(lesson.skillId) ?? [];
    list.push({ id: lesson.id, title: lesson.title });
    lessonsBySkill.set(lesson.skillId, list);
  }
  const progressByLesson = new Map(state.lessonProgress.map((p) => [p.lessonId, p.completed]));
  const exerciseProgress = new Map(state.exerciseProgress.map((p) => [p.exerciseId, p.solved]));
  const projectProgress = new Map(
    state.projectProgress.map((p) => [p.projectId, p]),
  );
  const exercisesBySkill = new Map<string, { id: string; title: string }[]>();
  for (const exercise of state.exercises) {
    const list = exercisesBySkill.get(exercise.skillId) ?? [];
    list.push({ id: exercise.id, title: exercise.title });
    exercisesBySkill.set(exercise.skillId, list);
  }

  const seen = new Set<string>();
  const out: Recommendation[] = [];

  const push = (rec: Recommendation): void => {
    const key = `${rec.type}:${rec.id}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(rec);
  };

  // 1. Continue an in-progress project.
  for (const project of state.projects) {
    const progress = projectProgress.get(project.id);
    if (progress?.started && !progress.completed) {
      push({
        type: "project",
        id: project.id,
        title: project.title,
        description: project.category,
        href: `/project/${project.id}`,
        reason: "Continue your project",
        score: SCORE.CONTINUE_PROJECT,
      });
    }
  }

  // 1b. Continue the next unfinished lesson in a skill the user already started.
  for (const skillId of order) {
    if (state.statuses.get(skillId) !== "UNLOCKED") continue;
    if (!hasLessonProgress(skillId, lessonsBySkill, progressByLesson)) continue;
    const next = nextLessonOf(skillId, lessonsBySkill, progressByLesson);
    if (!next) continue;
    push({
      type: "lesson",
      id: next.id,
      title: next.title,
      description: nameById.get(skillId) ?? "",
      href: `/skill/${skillId}/lesson/${next.id}`,
      reason: "Continue where you left off",
      score: SCORE.CONTINUE_LESSON,
      context: { skillId, skillName: nameById.get(skillId) ?? "" },
    });
    break;
  }

  // 2. Next unlocked skill in the roadmap (first in prerequisite order).
  for (const skillId of order) {
    if (state.statuses.get(skillId) !== "UNLOCKED") continue;
    const next = nextLessonOf(skillId, lessonsBySkill, progressByLesson);
    if (next) {
      push({
        type: "lesson",
        id: next.id,
        title: next.title,
        description: nameById.get(skillId) ?? "",
        href: `/skill/${skillId}/lesson/${next.id}`,
        reason: "Next in your roadmap",
        score: SCORE.NEXT_SKILL,
        context: { skillId, skillName: nameById.get(skillId) ?? "" },
      });
    } else {
      push({
        type: "skill",
        id: skillId,
        title: nameById.get(skillId) ?? "",
        description: descById.get(skillId) ?? "",
        href: `/skill/${skillId}`,
        reason: "Next in your roadmap",
        score: SCORE.NEXT_SKILL,
        context: { skillId, skillName: nameById.get(skillId) ?? "" },
      });
    }
    break;
  }

  // 3. Progress toward the primary goal course.
  const primaryGoal = state.goals.find((goal) => goal.courseId);
  if (primaryGoal?.courseId) {
    const courseId = primaryGoal.courseId;
    const courseSkillIds = state.courseSkills.get(courseId) ?? [];
    const courseName = state.courseNames.get(courseId) ?? "your goal";
    const courseComplete =
      courseSkillIds.length > 0 &&
      courseSkillIds.every((skillId) => state.statuses.get(skillId) === "COMPLETED");

    if (!courseComplete) {
      const target = courseSkillIds.find(
        (skillId) => state.statuses.get(skillId) !== "COMPLETED",
      );
      if (target) {
        const status = state.statuses.get(target);
        if (status === "UNLOCKED") {
          const next = nextLessonOf(target, lessonsBySkill, progressByLesson);
          if (next) {
            push({
              type: "lesson",
              id: next.id,
              title: next.title,
              description: nameById.get(target) ?? "",
              href: `/skill/${target}/lesson/${next.id}`,
              reason: `Goal: ${courseName}`,
              score: SCORE.GOAL,
              context: { skillId: target, skillName: nameById.get(target) ?? "" },
            });
          } else {
            push({
              type: "skill",
              id: target,
              title: nameById.get(target) ?? "",
              description: descById.get(target) ?? "",
              href: `/skill/${target}`,
              reason: `Goal: ${courseName}`,
              score: SCORE.GOAL,
              context: { skillId: target, skillName: nameById.get(target) ?? "" },
            });
          }
        } else if (status === "LOCKED") {
          // Surface the nearest actionable unmet prerequisite (may be external
          // to the goal course), so the learner always has a next step.
          const prereq = findUnmetPrereq(target, state.skillPrereqs, state.statuses);
          if (prereq) {
            push({
              type: "skill",
              id: prereq,
              title: nameById.get(prereq) ?? prereq,
              description: descById.get(prereq) ?? "",
              href: `/skill/${prereq}`,
              reason: `Prerequisite for ${courseName}`,
              score: SCORE.GOAL_PREREQ,
              context: { skillId: prereq, skillName: nameById.get(prereq) ?? prereq },
            });
          }
        }
      }
    }
  }

  // 4. Practice exercises for accessible skills the user has not solved.
  for (const skillId of order) {
    const status = state.statuses.get(skillId);
    if (status !== "UNLOCKED" && status !== "COMPLETED") continue;
    for (const exercise of exercisesBySkill.get(skillId) ?? []) {
      if (exerciseProgress.get(exercise.id)) continue;
      push({
        type: "exercise",
        id: exercise.id,
        title: exercise.title,
        description: nameById.get(skillId) ?? "",
        href: `/exercise/${exercise.id}`,
        reason: `Practice ${nameById.get(skillId) ?? ""}`,
        score: SCORE.PRACTICE,
        context: { skillId, skillName: nameById.get(skillId) ?? "" },
      });
    }
  }

  // 5. Projects whose required skills are all accessible, not yet started.
  for (const project of state.projects) {
    const progress = projectProgress.get(project.id);
    if (progress?.started || progress?.completed) continue;
    if (project.skillIds.length === 0) continue;
    const accessible = project.skillIds.every(
      (skillId) =>
        state.statuses.get(skillId) === "UNLOCKED" ||
        state.statuses.get(skillId) === "COMPLETED",
    );
    if (!accessible) continue;
    const allDone = project.skillIds.every(
      (skillId) => state.statuses.get(skillId) === "COMPLETED",
    );
    push({
      type: "project",
      id: project.id,
      title: project.title,
      description: project.category,
      href: `/project/${project.id}`,
      reason: `Build ${project.category}`,
      score: allDone ? SCORE.PROJECT_ALL_DONE : SCORE.PROJECT_READY,
    });
  }

  // Deterministic final order: score desc, then title, then id.
  out.sort(
    (a, b) =>
      b.score - a.score ||
      a.title.localeCompare(b.title) ||
      a.id.localeCompare(b.id),
  );
  return out;
}

/** DB-backed facade. Loads the user's state and returns the top N recommendations. */
export async function getRecommendations(userId: string, limit = 6): Promise<Recommendation[]> {
  const [
    skills,
    prereqRows,
    completed,
    lessons,
    lessonProgress,
    exercises,
    exerciseProgress,
    projects,
    projectProgress,
    goals,
    courses,
  ] = await Promise.all([
    prisma.skill.findMany({ select: { id: true, name: true, description: true } }),
    prisma.prerequisite.findMany(),
    getCompletedSkillIds(userId),
    prisma.lesson.findMany({
      orderBy: [{ skillId: "asc" }, { order: "asc" }],
      select: { id: true, title: true, skillId: true },
    }),
    prisma.lessonProgress.findMany({
      where: { userId },
      select: { lessonId: true, completed: true },
    }),
    prisma.exercise.findMany({
      orderBy: [{ skillId: "asc" }, { order: "asc" }],
      select: { id: true, title: true, difficulty: true, skillId: true },
    }),
    prisma.userExerciseProgress.findMany({
      where: { userId },
      select: { exerciseId: true, solved: true },
    }),
    prisma.project.findMany({
      orderBy: [{ order: "asc" }, { title: "asc" }],
      select: {
        id: true,
        title: true,
        category: true,
        skills: { select: { skillId: true } },
      },
    }),
    prisma.userProject.findMany({
      where: { userId },
      select: { projectId: true, startedAt: true, completed: true },
    }),
    prisma.userGoal.findMany({
      where: { userId, active: true },
      orderBy: { createdAt: "asc" },
      select: { courseId: true },
    }),
    prisma.course.findMany({
      select: { id: true, title: true, modules: { include: { skills: { select: { id: true } } } } },
    }),
  ]);

  const skillPrereqs = new Map<string, string[]>();
  for (const row of prereqRows) {
    const list = skillPrereqs.get(row.skillId) ?? [];
    list.push(row.prereqId);
    skillPrereqs.set(row.skillId, list);
  }

  const graph = skills.map((skill) => ({ id: skill.id, prereqIds: skillPrereqs.get(skill.id) ?? [] }));
  const statuses = deriveStatuses(graph, completed);

  const courseSkills = new Map<string, string[]>();
  const courseNames = new Map<string, string>();
  for (const course of courses) {
    courseNames.set(course.id, course.title);
    courseSkills.set(
      course.id,
      [...new Set(course.modules.flatMap((mod) => mod.skills.map((skill) => skill.id)))],
    );
  }

  const state: RecommendationState = {
    skills,
    skillPrereqs,
    statuses,
    lessons,
    lessonProgress,
    exercises,
    exerciseProgress,
    projects: projects.map((project) => ({
      id: project.id,
      title: project.title,
      category: project.category,
      skillIds: project.skills.map((link) => link.skillId),
    })),
    projectProgress: projectProgress.map((row) => ({
      projectId: row.projectId,
      started: row.startedAt !== null,
      completed: row.completed,
    })),
    goals,
    courseSkills,
    courseNames,
  };

  return rankRecommendations(state).slice(0, Math.max(0, limit));
}
