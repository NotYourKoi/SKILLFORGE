import Link from "next/link";
import { auth } from "@/auth";
import { getUserStats } from "@/lib/queries";
import { getDashboardProjects, type ProjectSummary } from "@/lib/projects";
import { getProgressOverview } from "@/lib/progression";
import { getRecommendations, type Recommendation } from "@/lib/recommendations";
import { AchievementChips } from "@/components/gamification/achievements-list";
import ProgressBar from "@/components/ui/progress-bar";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<Recommendation["type"], string> = {
  skill: "Skill",
  lesson: "Lesson",
  exercise: "Exercise",
  project: "Project",
};

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const [stats, dashboardProjects, overview, recommendations] = await Promise.all([
    getUserStats(userId),
    getDashboardProjects(userId),
    getProgressOverview(userId),
    getRecommendations(userId, 5),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-soot">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-soot/70">
          Welcome back, <span className="font-bold">@{session!.user!.username}</span>.
          Keep forging.
        </p>
      </div>

      <section className="border-2 border-ink bg-teal p-6 shadow-[4px_4px_0_#1e1e1e]">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
            Continue learning
          </h2>
          <Link
            href="/roadmap"
            className="text-sm font-bold uppercase text-soot underline hover:opacity-80"
          >
            Roadmap →
          </Link>
        </div>
        {overview.continueLearning ? (
          <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-xl font-black uppercase tracking-tight text-soot">
                {overview.continueLearning.skillName}
              </p>
              <p className="mt-1 text-sm text-soot/80">
                {overview.continueLearning.lesson
                  ? `Next: ${overview.continueLearning.lesson.title}`
                  : "Finish the next lesson to earn XP and keep your streak alive."}
              </p>
            </div>
            <Link
              href={overview.continueLearning.href}
              className="border-2 border-ink bg-cream px-5 py-3 text-sm font-bold uppercase text-soot shadow-[3px_3px_0_#1e1e1e] transition-transform hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_#1e1e1e]"
            >
              {overview.continueLearning.lesson ? "Continue →" : "Start →"}
            </Link>
          </div>
        ) : (
          <p className="mt-3 text-sm text-soot/80">
            Everything is complete. Review the{" "}
            <Link href="/roadmap" className="font-bold underline">
              roadmap
            </Link>{" "}
            for what&apos;s next.
          </p>
        )}
        {overview.continueLearning ? (
          <p className="mt-4 border-t-2 border-ink pt-3 text-xs text-soot/70">
            Need help?{" "}
            <Link
              href={`/skill/${overview.continueLearning.skillId}`}
              className="font-bold uppercase text-soot underline hover:opacity-80"
            >
              Ask AI Tutor →
            </Link>
          </p>
        ) : null}
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <section className="border-2 border-ink bg-unlocked p-5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
            Today&apos;s goal
          </h2>
          <p className="mt-2 text-lg font-black text-soot">{overview.todayGoal.title}</p>
          <Link
            href={overview.todayGoal.href}
            className="mt-3 inline-block border-2 border-ink bg-cream px-4 py-2 text-sm font-bold uppercase text-soot shadow-[3px_3px_0_#1e1e1e] transition-transform hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_#1e1e1e]"
          >
            Go →
          </Link>
        </section>

        <section className="border-2 border-ink bg-cream p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-soot">Level</h2>
            <span className="text-3xl font-black text-soot">{overview.level.level}</span>
          </div>
          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-soot/60">
            {overview.xp.total} total XP
          </p>
          <div className="mt-3">
            <ProgressBar value={overview.level.percent} label="Progress to next level" />
          </div>
          <p className="mt-1 text-xs text-soot/60">
            {overview.level.intoLevel}/{overview.level.xpForCurrent} XP to level{" "}
            {overview.level.level + 1}
          </p>
        </section>

        <section className="border-2 border-ink bg-cream p-5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-soot">Streak</h2>
          <p className="mt-2 text-4xl font-black text-soot">
            🔥 {overview.streak.currentStreak} days
          </p>
          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-soot/60">
            Longest: {overview.streak.longestStreak} days
          </p>
        </section>
      </div>

      <section className="border-2 border-ink bg-cream p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
            Your progress
          </h2>
          <span className="text-2xl font-black text-soot">{overview.overallPercent}%</span>
        </div>
        <div className="mt-3">
          <ProgressBar value={overview.overallPercent} label="Overall progress" />
        </div>
        <ul className="mt-4 flex flex-col gap-2">
          {overview.categories.map((category) => (
            <li key={category.label} className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-xs font-bold uppercase tracking-wide text-soot">
                {category.label}
              </span>
              <ProgressBar
                value={category.percent}
                className="h-3 flex-1"
                label={`${category.label} progress`}
              />
              <span className="w-10 shrink-0 text-right text-xs font-bold text-soot">
                {category.percent}%
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 grid grid-cols-2 gap-3 border-t-2 border-ink pt-4 sm:grid-cols-4">
          <StatCard label="Skills" value={stats.completed} tone="bg-complete" detail={`${overview.skills.unlocked} unlocked`} />
          <StatCard label="Lessons" value={overview.lessons.completed} tone="bg-cream" detail={`of ${overview.lessons.total}`} />
          <StatCard label="Exercises" value={overview.exercises.solved} tone="bg-unlocked" detail={`of ${overview.exercises.total}`} />
          <StatCard label="Projects" value={overview.projects.completed} tone="bg-locked" detail={`of ${overview.projects.total}`} />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
            Recommended for you
          </h2>
          <Link
            href="/explore"
            className="text-xs font-bold uppercase text-soot underline hover:text-soot/60"
          >
            See all →
          </Link>
        </div>
        {recommendations.length === 0 ? (
          <p className="border-2 border-ink bg-cream p-5 text-sm text-soot/70">
            Nothing to recommend yet. Set a course goal or start your roadmap.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {recommendations.map((rec) => (
              <li key={`${rec.type}:${rec.id}`}>
                <RecommendationRow rec={rec} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="border-2 border-ink bg-cream p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
            Your projects
          </h2>
          <Link
            href="/projects"
            className="text-sm font-bold uppercase text-soot underline hover:opacity-80"
          >
            All projects →
          </Link>
        </div>

        {dashboardProjects.current === null &&
        dashboardProjects.recent.length === 0 &&
        dashboardProjects.completed.length === 0 ? (
          <p className="mt-3 text-sm text-soot/70">
            No projects yet. Try a{" "}
            <Link href="/projects" className="font-bold underline">
              hands-on project
            </Link>{" "}
            to practice what you are learning.
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-4">
            {dashboardProjects.current ? (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-soot/70">
                  In progress
                </p>
                <ul className="mt-2 flex flex-col gap-2">
                  <ProjectRow project={dashboardProjects.current} />
                </ul>
              </div>
            ) : null}

            {dashboardProjects.recommended ? (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-soot/70">
                  Ready for you
                </p>
                <ul className="mt-2 flex flex-col gap-2">
                  <ProjectRow project={dashboardProjects.recommended} />
                </ul>
              </div>
            ) : null}

            {dashboardProjects.recent.length > 0 ? (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-soot/70">
                  Recently started
                </p>
                <ul className="mt-2 flex flex-col gap-2">
                  {dashboardProjects.recent.map((project) => (
                    <ProjectRow key={project.id} project={project} />
                  ))}
                </ul>
              </div>
            ) : null}

            {dashboardProjects.completed.length > 0 ? (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-soot/70">
                  Recently completed
                </p>
                <ul className="mt-2 flex flex-col gap-2">
                  {dashboardProjects.completed.slice(0, 2).map((project) => (
                    <ProjectRow key={project.id} project={project} />
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section className="border-2 border-ink bg-cream p-5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
            Completed skills
          </h2>
          {stats.completedSkills.length === 0 ? (
            <p className="mt-3 text-sm text-soot/70">
              Nothing yet. Head to the{" "}
              <Link href="/roadmap" className="font-bold underline">
                roadmap
              </Link>{" "}
              to unlock your first skill.
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {stats.completedSkills.map((skill) => (
                <li key={skill.id}>
                  <Link
                    href={`/skill/${skill.id}`}
                    className="flex items-center justify-between border-2 border-ink bg-complete px-3 py-2 text-sm font-bold text-soot hover:opacity-90"
                  >
                    <span>{skill.name}</span>
                    <span className="text-xs normal-case opacity-80">
                      {skill.completedAt?.toLocaleDateString() ?? ""}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="border-2 border-ink bg-cream p-5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
            Recent quiz attempts
          </h2>
          {stats.recentAttempts.length === 0 ? (
            <p className="mt-3 text-sm text-soot/70">No quizzes taken yet.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {stats.recentAttempts.map((attempt) => (
                <li
                  key={attempt.id}
                  className="flex items-center justify-between border-2 border-ink px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-bold text-soot">{attempt.quizTitle}</p>
                    <p className="text-xs text-soot/60">
                      {attempt.skillName} · {attempt.takenAt.toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`font-black ${attempt.passed ? "text-soot" : "text-danger"}`}
                  >
                    {attempt.score}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="border-2 border-ink bg-cream p-5">
        <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
          Recent achievements
        </h2>
        {overview.recentAchievements.length > 0 ? (
          <div className="mt-3">
            <AchievementChips achievements={overview.recentAchievements} />
          </div>
        ) : (
          <p className="mt-3 text-sm text-soot/70">
            Complete lessons, quizzes, exercises and projects to unlock your first
            achievement.{" "}
            <Link href="/progress" className="font-bold underline">
              See all →
            </Link>
          </p>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
  detail,
}: {
  label: string;
  value: number;
  tone: string;
  detail?: string;
}) {
  return (
    <div className={`border-2 border-ink ${tone} p-4 text-center`}>
      <p className="text-3xl font-black text-soot">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-widest text-soot/70">
        {label}
      </p>
      {detail ? <p className="mt-0.5 text-xs text-soot/60">{detail}</p> : null}
    </div>
  );
}

function RecommendationRow({ rec }: { rec: Recommendation }) {
  return (
    <Link
      href={rec.href}
      className="flex h-full flex-col gap-2 border-2 border-ink bg-cream p-4 shadow-[4px_4px_0_#1e1e1e] transition-transform hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#1e1e1e]"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="border-2 border-ink bg-teal px-2 py-0.5 text-xs font-bold uppercase text-soot">
          {TYPE_LABELS[rec.type]}
        </span>
        <span className="border-2 border-ink bg-unlocked px-2 py-0.5 text-xs font-bold uppercase text-soot">
          {rec.reason}
        </span>
      </div>
      <h3 className="text-lg font-black uppercase leading-tight tracking-tight text-soot">
        {rec.title}
      </h3>
      <p className="text-sm leading-6 text-soot/75">{rec.description}</p>
    </Link>
  );
}

function ProjectRow({ project }: { project: ProjectSummary }) {
  return (
    <li>
      <Link
        href={`/project/${project.id}`}
        className="flex flex-col gap-1 border-2 border-ink bg-grid px-3 py-2 hover:bg-teal"
      >
        <span className="flex items-center justify-between gap-2 text-sm font-bold text-soot">
          {project.title}
          <span className="text-xs font-bold uppercase text-soot/70">
            {project.progress.completed}/{project.progress.total} milestones
          </span>
        </span>
        <span className="text-xs text-soot/60">{project.description}</span>
      </Link>
    </li>
  );
}
