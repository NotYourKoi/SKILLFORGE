import Link from "next/link";
import { auth } from "@/auth";
import { getUserProgress } from "@/lib/queries";
import { getProgressProjects } from "@/lib/projects";
import { getProgressOverview } from "@/lib/progression";
import { AchievementGrid } from "@/components/gamification/achievements-list";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const session = await auth();
  const userId = session!.user!.id;
  const [progress, projects, overview] = await Promise.all([
    getUserProgress(userId),
    getProgressProjects(userId),
    getProgressOverview(userId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-soot">
          Progress
        </h1>
        <p className="mt-1 text-sm text-soot/70">
          Your XP, streaks, courses, and achievements — plus lesson, quiz and project
          history, skill by skill.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <section className="border-2 border-ink bg-cream p-5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-soot">Level</h2>
          <div className="mt-2 flex items-end justify-between">
            <span className="text-4xl font-black text-soot">{overview.level.level}</span>
            <span className="text-xs font-bold uppercase text-soot/60">
              {overview.xp.total} XP
            </span>
          </div>
          <div className="mt-3 h-4 border-2 border-ink bg-grid">
            <div
              className="h-full bg-complete"
              style={{ width: `${overview.level.percent}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-soot/60">
            {overview.level.intoLevel}/{overview.level.xpForCurrent} XP to level{" "}
            {overview.level.level + 1}
          </p>
        </section>

        <section className="border-2 border-ink bg-cream p-5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-soot">Streak</h2>
          <div className="mt-2 flex items-end justify-between">
            <span className="text-4xl font-black text-soot">
              🔥 {overview.streak.currentStreak}
            </span>
            <span className="text-xs font-bold uppercase text-soot/60">
              Longest: {overview.streak.longestStreak}
            </span>
          </div>
          <p className="mt-3 text-xs text-soot/60">
            Learn each day to keep it alive — lessons, quizzes, exercises and projects
            count.
          </p>
        </section>

        <section className="border-2 border-ink bg-cream p-5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
            Overall
          </h2>
          <div className="mt-2 flex items-end justify-between">
            <span className="text-4xl font-black text-soot">{overview.overallPercent}%</span>
            <span className="text-xs font-bold uppercase text-soot/60">
              {overview.coursesCompleted} course{overview.coursesCompleted === 1 ? "" : "s"}{" "}
              completed
            </span>
          </div>
          <div className="mt-3 h-4 border-2 border-ink bg-grid">
            <div
              className="h-full bg-complete"
              style={{ width: `${overview.overallPercent}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-soot/60">
            Average of your skills, lessons, exercises and projects.
          </p>
        </section>
      </div>

      {overview.courses.length > 0 ? (
        <section className="border-2 border-ink bg-cream p-5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-soot">Courses</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {overview.courses.map((course) => (
              <li key={course.id} className="flex items-center gap-3">
                <Link
                  href={`/course/${course.slug}`}
                  className="w-1/3 shrink-0 text-sm font-bold uppercase text-soot hover:opacity-80 sm:w-64"
                >
                  {course.title}
                </Link>
                <div className="h-3 flex-1 border-2 border-ink bg-grid">
                  <div
                    className={`h-full ${course.completed ? "bg-complete" : "bg-unlocked"}`}
                    style={{ width: `${course.percent}%` }}
                  />
                </div>
                <span className="w-14 shrink-0 text-right text-xs font-bold text-soot">
                  {course.completed ? "✓" : ""} {course.percent}%
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="border-2 border-ink bg-cream p-5">
        <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
          Achievements
        </h2>
        <p className="mt-1 text-xs text-soot/60">
          {overview.achievements.filter((a) => a.unlocked).length} of{" "}
          {overview.achievements.length} unlocked.
        </p>
        <div className="mt-3">
          <AchievementGrid achievements={overview.achievements} />
        </div>
      </section>

      {projects.length > 0 ? (
        <section className="border-2 border-ink bg-cream p-5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
            Projects
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/project/${project.id}`}
                className="flex flex-col gap-1 border-2 border-ink bg-grid px-3 py-2 hover:bg-teal"
              >
                <span className="flex items-center justify-between gap-2 text-sm font-bold text-soot">
                  {project.title}
                  <span
                    className={`px-1 text-xs uppercase ${
                      project.status === "completed"
                        ? "bg-complete"
                        : project.status === "in-progress"
                          ? "bg-unlocked"
                          : "bg-cream"
                    }`}
                  >
                    {project.status === "completed"
                      ? "Completed"
                      : project.status === "in-progress"
                        ? "In progress"
                        : "Not started"}
                  </span>
                </span>
                <span className="text-xs text-soot/60">
                  {project.progress.completed}/{project.progress.total} milestones
                  {project.completedAt
                    ? ` · done ${project.completedAt.toLocaleDateString()}`
                    : ""}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {progress.length === 0 ? (
        <p className="border-2 border-ink bg-cream p-5 text-sm text-soot/70">
          No progress yet. Pick a skill from the{" "}
          <Link href="/roadmap" className="font-bold underline">
            roadmap
          </Link>{" "}
          and get started.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {progress.map((skill) => (
            <section
              key={skill.skillId}
              className="border-2 border-ink bg-cream p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link
                  href={`/skill/${skill.skillId}`}
                  className="text-lg font-black uppercase text-soot hover:opacity-80"
                >
                  {skill.skillName}
                </Link>
                <span className="text-xs font-bold uppercase text-soot/70">
                  Lessons {skill.completedLessons}/{skill.totalLessons}
                </span>
              </div>

              <div className="mt-3 h-3 w-full border-2 border-ink bg-grid">
                <div
                  className="h-full bg-complete"
                  style={{
                    width: `${
                      skill.totalLessons === 0
                        ? 0
                        : (skill.completedLessons / skill.totalLessons) * 100
                    }%`,
                  }}
                />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {skill.lessonsCompleted ? (
                  <span className="border-2 border-ink bg-complete px-2 py-0.5 text-xs font-bold uppercase text-soot">
                    Lessons done
                  </span>
                ) : null}
                {skill.lastQuiz ? (
                  <span
                    className={`border-2 border-ink px-2 py-0.5 text-xs font-bold uppercase ${
                      skill.lastQuiz.passed ? "bg-complete" : "bg-danger"
                    } text-soot`}
                  >
                    Quiz: {skill.lastQuiz.score}% ·{" "}
                    {skill.lastQuiz.passed ? "passed" : "failed"}
                  </span>
                ) : (
                  <span className="text-xs font-bold uppercase text-soot/50">
                    No quiz attempts
                  </span>
                )}
              </div>

              {skill.quizAttempts.length > 1 ? (
                <ul className="mt-3 flex flex-col gap-1">
                  {skill.quizAttempts.map((attempt) => (
                    <li
                      key={attempt.id}
                      className="flex justify-between text-xs text-soot/70"
                    >
                      <span>
                        {attempt.quizTitle} ·{" "}
                        {attempt.takenAt.toLocaleString()}
                      </span>
                      <span
                        className={`font-black ${attempt.passed ? "text-soot" : "text-danger"}`}
                      >
                        {attempt.score}%
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
