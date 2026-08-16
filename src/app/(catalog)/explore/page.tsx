import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/auth";
import ContinueLearningCard from "@/components/continue-learning";
import CourseCard from "@/components/course-card";
import { getCourses } from "@/lib/courses";
import { getProgressOverview } from "@/lib/progression";
import { getRecommendations, type Recommendation } from "@/lib/recommendations";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Explore — SkillForge",
  description:
    "Discover structured courses, skills, exercises and projects — plus personalised recommendations once you sign in.",
};

const TYPE_LABELS: Record<Recommendation["type"], string> = {
  skill: "Skill",
  lesson: "Lesson",
  exercise: "Exercise",
  project: "Project",
};

export default async function ExplorePage() {
  const session = await auth();
  const courses = await getCourses(session?.user?.id ?? null);

  if (!session?.user?.id) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-soot">
            Explore
          </h1>
          <p className="mt-1 text-sm text-soot/70">
            Discover structured courses, skills, exercises and projects.
          </p>
        </div>

        <section className="border-2 border-ink bg-cream p-5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
            Personalised recommendations
          </h2>
          <p className="mt-1 text-sm text-soot/70">
            Log in to get a personalised learning plan, continue where you left
            off, and set course goals.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="border-2 border-ink bg-complete px-4 py-2 text-sm font-bold uppercase text-soot shadow-[3px_3px_0_#1e1e1e]"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="border-2 border-ink bg-cream px-4 py-2 text-sm font-bold uppercase text-soot shadow-[3px_3px_0_#1e1e1e]"
            >
              Create account
            </Link>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
            Browse courses
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.slice(0, 6).map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>
      </div>
    );
  }

  const [overview, recommendations] = await Promise.all([
    getProgressOverview(session.user.id),
    getRecommendations(session.user.id, 8),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-soot">
          Explore
        </h1>
        <p className="mt-1 text-sm text-soot/70">
          Your personalised learning plan, @{session.user.username}.
        </p>
      </div>

      {overview.continueLearning ? (
        <section>
          <ContinueLearningCard item={overview.continueLearning} />
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
          Recommended for you
        </h2>
        {recommendations.length === 0 ? (
          <p className="border-2 border-ink bg-cream p-5 text-sm text-soot/70">
            Nothing to recommend yet. Set a course goal or start your roadmap.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {recommendations.map((rec) => (
              <li key={`${rec.type}:${rec.id}`}>
                <RecommendationRow rec={rec} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {overview.goals.length > 0 ? (
        <section className="border-2 border-ink bg-cream p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
              Your goals
            </h2>
            <Link
              href="/courses"
              className="text-xs font-bold uppercase text-soot underline hover:text-soot/60"
            >
              Manage
            </Link>
          </div>
          <ul className="mt-3 flex flex-col gap-2">
            {overview.goals.map((goal) => (
              <li key={goal.id}>
                {goal.courseSlug ? (
                  <Link
                    href={`/course/${goal.courseSlug}`}
                    className="flex flex-wrap items-baseline justify-between gap-2 border-2 border-ink bg-grid px-3 py-2 text-sm font-bold text-soot hover:bg-teal"
                  >
                    <span>{goal.goal}</span>
                    <span className="text-xs uppercase opacity-70">
                      {goal.courseCategory ?? ""}
                    </span>
                  </Link>
                ) : (
                  <span className="flex items-baseline justify-between gap-2 border-2 border-ink bg-grid px-3 py-2 text-sm font-bold text-soot">
                    {goal.goal}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
            Browse courses
          </h2>
          <Link
            href="/courses"
            className="text-xs font-bold uppercase text-soot underline hover:text-soot/60"
          >
            All courses →
          </Link>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.slice(0, 6).map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </section>
    </div>
  );
}

function RecommendationRow({ rec }: { rec: Recommendation }) {
  return (
    <Link
      href={rec.href}
      className="flex flex-col gap-2 border-2 border-ink bg-cream p-4 shadow-[4px_4px_0_#1e1e1e] transition-transform hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#1e1e1e]"
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
