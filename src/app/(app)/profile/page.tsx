import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getProgressOverview } from "@/lib/progression";
import { getUserGoals, listCoursesForGoals } from "@/lib/goals";
import { getLearningPath } from "@/lib/learning-path";
import { AchievementChips } from "@/components/gamification/achievements-list";
import AiPreferenceToggle from "@/components/ai/preference-toggle";
import GoalManager from "@/components/goals/goal-manager";
import LearningPathList from "@/components/goals/learning-path-list";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();
  const userId = session!.user!.id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) return null;

  const [overview, goals, courseOptions] = await Promise.all([
    getProgressOverview(userId),
    getUserGoals(userId),
    listCoursesForGoals(),
  ]);

  const paths = await Promise.all(
    goals
      .filter((goal) => goal.courseId)
      .map(async (goal) => ({
        goal,
        path: (await getLearningPath(userId, goal.courseId!))!,
      })),
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-soot">
          Profile
        </h1>
        <p className="mt-1 text-sm text-soot/70">Your account details and stats.</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <section className="w-full max-w-md shrink-0 border-2 border-ink bg-cream p-6">
          <dl className="flex flex-col gap-4 text-sm">
            <div className="flex justify-between">
              <dt className="font-bold uppercase text-soot/60">Username</dt>
              <dd className="font-bold text-soot">{user.username}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-bold uppercase text-soot/60">Email</dt>
              <dd className="font-bold text-soot">{user.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-bold uppercase text-soot/60">Role</dt>
              <dd className="font-bold text-soot">{user.role}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-bold uppercase text-soot/60">Member since</dt>
              <dd className="font-bold text-soot">
                {user.createdAt.toLocaleDateString()}
              </dd>
            </div>
          </dl>

          <div className="mt-6 border-t-2 border-ink pt-5">
            <dl className="flex flex-col gap-4 text-sm">
              <div className="flex justify-between">
                <dt className="font-bold uppercase text-soot/60">Level</dt>
                <dd className="font-bold text-soot">{overview.level.level}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-bold uppercase text-soot/60">XP</dt>
                <dd className="font-bold text-soot">{overview.xp.total}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-bold uppercase text-soot/60">Current streak</dt>
                <dd className="font-bold text-soot">
                  🔥 {overview.streak.currentStreak} days
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-bold uppercase text-soot/60">Longest streak</dt>
                <dd className="font-bold text-soot">{overview.streak.longestStreak} days</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-bold uppercase text-soot/60">Skills completed</dt>
                <dd className="font-bold text-soot">
                  {overview.skills.completed}/{overview.skills.total}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-bold uppercase text-soot/60">Lessons completed</dt>
                <dd className="font-bold text-soot">
                  {overview.lessons.completed}/{overview.lessons.total}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-bold uppercase text-soot/60">Exercises solved</dt>
                <dd className="font-bold text-soot">
                  {overview.exercises.solved}/{overview.exercises.total}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-bold uppercase text-soot/60">Projects completed</dt>
                <dd className="font-bold text-soot">
                  {overview.projects.completed}/{overview.projects.total}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-bold uppercase text-soot/60">Courses completed</dt>
                <dd className="font-bold text-soot">{overview.coursesCompleted}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-bold uppercase text-soot/60">Quizzes passed</dt>
                <dd className="font-bold text-soot">
                  {overview.quizAttempts.passed}/{overview.quizAttempts.total}
                </dd>
              </div>
            </dl>
          </div>

          <div className="mt-6 border-t-2 border-ink pt-5">
            <GoalManager goals={goals} options={courseOptions} />
          </div>

          <div className="mt-6 border-t-2 border-ink pt-5">
            <AiPreferenceToggle initial={user.aiEnabled} />
          </div>
        </section>

        <section className="flex-1 border-2 border-ink bg-cream p-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
            Achievements
          </h2>
          <p className="mt-1 text-xs text-soot/60">
            {overview.achievements.filter((a) => a.unlocked).length} of{" "}
            {overview.achievements.length} unlocked.
          </p>
          <div className="mt-4">
            <AchievementChips achievements={overview.achievements} />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/progress"
              className="border-2 border-ink bg-unlocked px-4 py-2 text-sm font-bold uppercase text-soot shadow-[3px_3px_0_#1e1e1e] transition-transform hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_#1e1e1e]"
            >
              View progress →
            </Link>
            <Link
              href="/roadmap"
              className="text-sm font-bold uppercase text-soot/70 hover:text-soot"
            >
              ← Back to roadmap
            </Link>
          </div>
        </section>
      </div>

      {paths.length > 0 ? (
        <section className="flex flex-col gap-4 border-2 border-ink bg-cream p-5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
            Learning paths
          </h2>
          <div className="flex flex-col gap-6">
            {paths.map(({ goal, path }) => (
              <div key={goal.id} className="flex flex-col gap-2">
                <Link
                  href={goal.courseSlug ? `/course/${goal.courseSlug}` : "/courses"}
                  className="text-lg font-black uppercase tracking-tight text-soot hover:underline"
                >
                  {path.courseTitle}
                </Link>
                <LearningPathList path={path} />
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
