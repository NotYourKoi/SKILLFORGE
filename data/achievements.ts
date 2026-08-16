/**
 * Achievement catalog. Single source of truth for which achievements exist,
 * how each is earned (`kind` + `threshold`) and what it rewards.
 *
 * The Achievement rows are mirrored into the DB (for UserAchievement links and
 * display), but the evaluation logic reads THIS file so tuning an achievement
 * never requires a migration.
 */
export type AchievementKind =
  | "LESSONS_COMPLETED"
  | "QUIZZES_PASSED"
  | "EXERCISES_SOLVED"
  | "PROJECTS_COMPLETED"
  | "COURSES_COMPLETED"
  | "STREAK_DAYS";

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  xpReward: number;
  kind: AchievementKind;
  threshold: number;
}

export const achievements: AchievementDefinition[] = [
  {
    id: "ACH_FIRST_LESSON",
    title: "First Lesson",
    description: "Complete your first lesson.",
    icon: "📖",
    category: "Learning",
    xpReward: 10,
    kind: "LESSONS_COMPLETED",
    threshold: 1,
  },
  {
    id: "ACH_10_LESSONS",
    title: "10 Lessons",
    description: "Complete 10 lessons.",
    icon: "📚",
    category: "Learning",
    xpReward: 25,
    kind: "LESSONS_COMPLETED",
    threshold: 10,
  },
  {
    id: "ACH_25_LESSONS",
    title: "25 Lessons",
    description: "Complete 25 lessons.",
    icon: "🏛",
    category: "Learning",
    xpReward: 60,
    kind: "LESSONS_COMPLETED",
    threshold: 25,
  },
  {
    id: "ACH_FIRST_QUIZ",
    title: "First Quiz",
    description: "Pass your first quiz.",
    icon: "🧠",
    category: "Practice",
    xpReward: 10,
    kind: "QUIZZES_PASSED",
    threshold: 1,
  },
  {
    id: "ACH_FIRST_EXERCISE",
    title: "First Exercise",
    description: "Solve your first coding exercise.",
    icon: "⚙️",
    category: "Practice",
    xpReward: 15,
    kind: "EXERCISES_SOLVED",
    threshold: 1,
  },
  {
    id: "ACH_5_EXERCISES",
    title: "5 Exercises Solved",
    description: "Solve 5 coding exercises.",
    icon: "🔧",
    category: "Practice",
    xpReward: 40,
    kind: "EXERCISES_SOLVED",
    threshold: 5,
  },
  {
    id: "ACH_FIRST_PROJECT",
    title: "First Project",
    description: "Complete your first project.",
    icon: "🚀",
    category: "Building",
    xpReward: 25,
    kind: "PROJECTS_COMPLETED",
    threshold: 1,
  },
  {
    id: "ACH_3_PROJECTS",
    title: "3 Projects Completed",
    description: "Complete 3 projects.",
    icon: "🏗️",
    category: "Building",
    xpReward: 60,
    kind: "PROJECTS_COMPLETED",
    threshold: 3,
  },
  {
    id: "ACH_7_DAY_STREAK",
    title: "7 Day Streak",
    description: "Learn on 7 consecutive days.",
    icon: "🔥",
    category: "Consistency",
    xpReward: 30,
    kind: "STREAK_DAYS",
    threshold: 7,
  },
  {
    id: "ACH_30_DAY_STREAK",
    title: "30 Day Streak",
    description: "Learn on 30 consecutive days.",
    icon: "🌋",
    category: "Consistency",
    xpReward: 150,
    kind: "STREAK_DAYS",
    threshold: 30,
  },
  {
    id: "ACH_FIRST_COURSE",
    title: "First Course",
    description: "Complete a full course.",
    icon: "🏆",
    category: "Courses",
    xpReward: 50,
    kind: "COURSES_COMPLETED",
    threshold: 1,
  },
];

export const achievementById = new Map(
  achievements.map((achievement) => [achievement.id, achievement]),
);
