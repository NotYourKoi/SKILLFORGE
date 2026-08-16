import { prisma } from "@/lib/db";
import { getRoadmap, getUserStats } from "@/lib/queries";
import { getProjects } from "@/lib/projects";
import { getUserGoals, type GoalView } from "@/lib/goals";
import { getAchievements, type AchievementView } from "./achievements";
import { getCourseProgress, type CourseProgressView } from "./courses";
import { levelFromXp, type LevelInfo } from "./levels";
import { getLiveStreak, getStoredStreak, type StreakState } from "./streaks";
import { getTotalXp } from "./xp";

/**
 * Central progress aggregation. One entry point used by the dashboard,
 * progress and profile pages so progress maths is never duplicated.
 */

export interface OverviewCategory {
  label: string;
  completed: number;
  total: number;
  percent: number;
  href: string;
}

export interface TodayGoal {
  title: string;
  href: string;
}

export interface ContinueLearningItem {
  skillId: string;
  skillName: string;
  lesson: { id: string; title: string } | null;
  href: string;
}

export interface ProgressOverview {
  xp: { total: number };
  level: LevelInfo;
  streak: StreakState;
  skills: { total: number; completed: number; unlocked: number; locked: number; percent: number };
  lessons: { total: number; completed: number; percent: number };
  exercises: { total: number; solved: number; attempted: number; percent: number };
  projects: { total: number; completed: number; inProgress: number; percent: number };
  courses: CourseProgressView[];
  coursesCompleted: number;
  overallPercent: number;
  categories: OverviewCategory[];
  achievements: AchievementView[];
  recentAchievements: AchievementView[];
  continueLearning: ContinueLearningItem | null;
  todayGoal: TodayGoal;
  quizAttempts: { total: number; passed: number };
  goals: GoalView[];
}

function percentOf(completed: number, total: number): number {
  return total === 0 ? 0 : Math.round((completed / total) * 100);
}

async function pickContinueLearning(userId: string): Promise<ContinueLearningItem | null> {
  const roadmap = await getRoadmap(userId);
  const unlocked = roadmap.filter((skill) => skill.status === "UNLOCKED");
  if (unlocked.length === 0) return null;

  const skillIds = unlocked.map((skill) => skill.id);
  const [lessons, progress] = await Promise.all([
    prisma.lesson.findMany({
      where: { skillId: { in: skillIds } },
      select: { id: true, title: true, skillId: true },
    }),
    prisma.lessonProgress.findMany({
      where: { userId, completed: true },
      select: { lessonId: true },
    }),
  ]);
  const done = new Set(progress.map((row) => row.lessonId));

  for (const skill of unlocked) {
    const next = lessons.find(
      (lesson) => lesson.skillId === skill.id && !done.has(lesson.id),
    );
    if (next) {
      return {
        skillId: skill.id,
        skillName: skill.name,
        lesson: { id: next.id, title: next.title },
        href: `/skill/${skill.id}/lesson/${next.id}`,
      };
    }
  }
  return {
    skillId: unlocked[0].id,
    skillName: unlocked[0].name,
    lesson: null,
    href: `/skill/${unlocked[0].id}`,
  };
}

function buildTodayGoal(
  continueLearning: ContinueLearningItem | null,
  projectStats: { total: number; completed: number },
): TodayGoal {
  if (continueLearning) {
    return { title: "Complete one lesson", href: continueLearning.href };
  }
  if (projectStats.total > 0 && projectStats.completed < projectStats.total) {
    return { title: "Start a project", href: "/projects" };
  }
  return { title: "Review the roadmap", href: "/roadmap" };
}

export async function getProgressOverview(userId: string): Promise<ProgressOverview> {
  const [
    totalXp,
    storedStreak,
    skillStats,
    lessonCounts,
    exerciseCounts,
    quizCounts,
    projectSummaries,
    courseProgress,
    achievementViews,
    continueLearning,
    goals,
  ] = await Promise.all([
    getTotalXp(userId),
    getStoredStreak(userId),
    getUserStats(userId),
    prisma.lesson.aggregate({ _count: true }),
    prisma.$transaction([
      prisma.exercise.aggregate({ _count: true }),
      prisma.userExerciseProgress.aggregate({
        where: { userId, solved: true },
        _count: true,
      }),
      prisma.userExerciseProgress.aggregate({
        where: { userId, attempted: true },
        _count: true,
      }),
    ]),
    prisma.$transaction([
      prisma.quizAttempt.aggregate({ where: { userId }, _count: true }),
      prisma.quizAttempt.count({ where: { userId, passed: true } }),
    ]),
    getProjects(userId),
    getCourseProgress(userId),
    getAchievements(userId),
    pickContinueLearning(userId),
    getUserGoals(userId),
  ]);

  const lessonsCompleted = await prisma.lessonProgress.count({
    where: { userId, completed: true },
  });

  const lessonTotal = lessonCounts._count;
  const exerciseTotal = exerciseCounts[0]._count;
  const exercisesSolved = exerciseCounts[1]._count;
  const exercisesAttempted = exerciseCounts[2]._count;

  const projectTotal = projectSummaries.length;
  const projectsCompleted = projectSummaries.filter(
    (project) => project.status === "completed",
  ).length;
  const projectsInProgress = projectSummaries.filter(
    (project) => project.status === "in-progress",
  ).length;

  const coursesCompleted = courseProgress.filter((course) => course.completed).length;
  const streak = getLiveStreak(storedStreak);

  const lessonPercent = percentOf(lessonsCompleted, lessonTotal);
  const exercisePercent = percentOf(exercisesSolved, exerciseTotal);
  const projectPercent = percentOf(projectsCompleted, projectTotal);

  const tracked = [skillStats.progressPercent, lessonPercent, exercisePercent, projectPercent];
  const overallPercent = Math.round(
    tracked.reduce((sum, value) => sum + value, 0) / tracked.length,
  );

  const recentAchievements = achievementViews
    .filter((achievement) => achievement.unlocked)
    .sort(
      (a, b) => (b.unlockedAt?.getTime() ?? 0) - (a.unlockedAt?.getTime() ?? 0),
    )
    .slice(0, 3);

  return {
    xp: { total: totalXp },
    level: levelFromXp(totalXp),
    streak,
    skills: {
      total: skillStats.total,
      completed: skillStats.completed,
      unlocked: skillStats.unlocked,
      locked: skillStats.locked,
      percent: skillStats.progressPercent,
    },
    lessons: {
      total: lessonTotal,
      completed: lessonsCompleted,
      percent: lessonPercent,
    },
    exercises: {
      total: exerciseTotal,
      solved: exercisesSolved,
      attempted: exercisesAttempted,
      percent: exercisePercent,
    },
    projects: {
      total: projectTotal,
      completed: projectsCompleted,
      inProgress: projectsInProgress,
      percent: projectPercent,
    },
    courses: courseProgress,
    coursesCompleted,
    overallPercent,
    categories: [
      { label: "Skills", completed: skillStats.completed, total: skillStats.total, percent: skillStats.progressPercent, href: "/roadmap" },
      { label: "Lessons", completed: lessonsCompleted, total: lessonTotal, percent: lessonPercent, href: "/roadmap" },
      { label: "Exercises", completed: exercisesSolved, total: exerciseTotal, percent: exercisePercent, href: "/roadmap" },
      { label: "Projects", completed: projectsCompleted, total: projectTotal, percent: projectPercent, href: "/projects" },
    ],
    achievements: achievementViews,
    recentAchievements,
    continueLearning,
    todayGoal: buildTodayGoal(continueLearning, {
      total: projectTotal,
      completed: projectsCompleted,
    }),
    quizAttempts: {
      total: quizCounts[0]._count,
      passed: quizCounts[1],
    },
    goals,
  };
}
