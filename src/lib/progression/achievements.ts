import { prisma } from "@/lib/db";
import { achievements, type AchievementDefinition } from "../../../data/achievements";
import { getCompletedCourseIds } from "./courses";
import { getLiveStreak } from "./streaks";
import { awardXp } from "./xp";

/**
 * Achievement evaluation service. Reads the catalog in data/achievements and
 * evaluates each definition against the user's actual progress. Unlocks are
 * idempotent (UserAchievement unique key + XP event unique key), so running
 * evaluation after any meaningful action is always safe.
 */

export interface AchievementView {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  xpReward: number;
  unlocked: boolean;
  unlockedAt: Date | null;
}

interface StatsForAchievements {
  lessonsCompleted: number;
  quizzesPassed: number;
  exercisesSolved: number;
  projectsCompleted: number;
  coursesCompleted: number;
  currentStreak: number;
}

async function collectStats(userId: string): Promise<StatsForAchievements> {
  const [lessonsCompleted, passedQuizzes, exercisesSolved, projectsCompleted, completedCourses, stored] =
    await Promise.all([
      prisma.lessonProgress.count({ where: { userId, completed: true } }),
      prisma.quizAttempt.findMany({
        where: { userId, passed: true },
        select: { quizId: true },
      }),
      prisma.userExerciseProgress.count({ where: { userId, solved: true } }),
      prisma.userProject.count({ where: { userId, completed: true } }),
      getCompletedCourseIds(userId),
      prisma.user.findUnique({
        where: { id: userId },
        select: { currentStreak: true, longestStreak: true, lastActiveDate: true },
      }),
    ]);

  return {
    lessonsCompleted,
    quizzesPassed: new Set(passedQuizzes.map((row) => row.quizId)).size,
    exercisesSolved,
    projectsCompleted,
    coursesCompleted: completedCourses.size,
    currentStreak: getLiveStreak(
      stored ?? { currentStreak: 0, longestStreak: 0, lastActiveDate: null },
    ).currentStreak,
  };
}

function reached(definition: AchievementDefinition, stats: StatsForAchievements): boolean {
  switch (definition.kind) {
    case "LESSONS_COMPLETED":
      return stats.lessonsCompleted >= definition.threshold;
    case "QUIZZES_PASSED":
      return stats.quizzesPassed >= definition.threshold;
    case "EXERCISES_SOLVED":
      return stats.exercisesSolved >= definition.threshold;
    case "PROJECTS_COMPLETED":
      return stats.projectsCompleted >= definition.threshold;
    case "COURSES_COMPLETED":
      return stats.coursesCompleted >= definition.threshold;
    case "STREAK_DAYS":
      return stats.currentStreak >= definition.threshold;
    default:
      return false;
  }
}

/** Mirrors a catalog definition into the DB so UserAchievement links always resolve. */
async function ensureDefinition(definition: AchievementDefinition): Promise<void> {
  await prisma.achievement.upsert({
    where: { id: definition.id },
    update: {
      title: definition.title,
      description: definition.description,
      icon: definition.icon,
      category: definition.category,
      xpReward: definition.xpReward,
    },
    create: {
      id: definition.id,
      title: definition.title,
      description: definition.description,
      icon: definition.icon,
      category: definition.category,
      xpReward: definition.xpReward,
    },
  });
}

export interface UnlockedAchievement {
  id: string;
  title: string;
  icon: string;
}

/**
 * Evaluates every catalog achievement and unlocks any that are newly earned,
 * awarding each unlock's XP. Returns only the newly unlocked achievements.
 */
export async function evaluateAndUnlockAchievements(
  userId: string,
): Promise<{ unlocked: UnlockedAchievement[] }> {
  const [stats, existingRows] = await Promise.all([
    collectStats(userId),
    prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true },
    }),
  ]);

  const unlockedSet = new Set(existingRows.map((row) => row.achievementId));
  const unlocked: UnlockedAchievement[] = [];

  for (const definition of achievements) {
    if (unlockedSet.has(definition.id)) continue;
    if (!reached(definition, stats)) continue;

    await ensureDefinition(definition);
    try {
      await prisma.userAchievement.create({
        data: { userId, achievementId: definition.id },
      });
    } catch (error) {
      if ((error as { code?: string }).code === "P2002") continue;
      throw error;
    }
    await awardXp(userId, "ACHIEVEMENT_UNLOCKED", definition.id, definition.xpReward);
    unlocked.push({ id: definition.id, title: definition.title, icon: definition.icon });
  }

  return { unlocked };
}

/** All catalog achievements with the user's unlock state, for display. */
export async function getAchievements(userId: string): Promise<AchievementView[]> {
  const unlockedRows = await prisma.userAchievement.findMany({
    where: { userId },
    select: { achievementId: true, unlockedAt: true },
  });
  const unlockedAtById = new Map(unlockedRows.map((row) => [row.achievementId, row.unlockedAt]));

  return achievements.map((definition) => ({
    id: definition.id,
    title: definition.title,
    description: definition.description,
    icon: definition.icon,
    category: definition.category,
    xpReward: definition.xpReward,
    unlocked: unlockedAtById.has(definition.id),
    unlockedAt: unlockedAtById.get(definition.id) ?? null,
  }));
}
