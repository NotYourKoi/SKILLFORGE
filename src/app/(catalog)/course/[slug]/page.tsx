import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import CourseProgressBar from "@/components/course-progress-bar";
import SetGoalButton from "@/components/goals/set-goal-button";
import LearningPathList from "@/components/goals/learning-path-list";
import { formatMinutes } from "@/lib/format";
import { getCourseBySlug } from "@/lib/courses";
import { getProjectsBySkillIds } from "@/lib/projects";
import { getUserGoals } from "@/lib/goals";
import { getLearningPath } from "@/lib/learning-path";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = await prisma.course.findUnique({
    where: { slug },
    select: { title: true, description: true, category: true },
  });
  if (!course) {
    return { title: "Course not found — SkillForge" };
  }
  return {
    title: `${course.title} — SkillForge`,
    description: course.description,
    keywords: [course.category],
  };
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  const course = await getCourseBySlug(slug, session?.user?.id ?? null);

  if (!course) notFound();

  const courseSkillIds = [
    ...new Set(course.modules.flatMap((mod) => mod.skills.map((skill) => skill.id))),
  ];
  const projects = session?.user?.id
    ? await getProjectsBySkillIds(courseSkillIds, session.user.id)
    : [];

  const goals = session?.user?.id ? await getUserGoals(session.user.id) : [];
  const isGoal = goals.some((goal) => goal.courseId === course.id);
  const learningPath = session?.user?.id
    ? await getLearningPath(session.user.id, course.id)
    : null;

  const firstUnlocked = course.modules
    .flatMap((m) => m.skills)
    .find((skill) => skill.status === "UNLOCKED");
  const continueSkill = course.modules
    .flatMap((m) => m.skills)
    .find((skill) => skill.status === "UNLOCKED" || skill.status === "COMPLETED");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/courses"
          className="text-sm font-bold uppercase text-soot/70 hover:text-soot"
        >
          ← Courses
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-black uppercase tracking-tight text-soot">
            {course.title}
          </h1>
          <span className="border-2 border-ink bg-teal px-2 py-0.5 text-xs font-bold uppercase text-soot">
            {course.category}
          </span>
          <span className="border-2 border-ink bg-grid px-2 py-0.5 text-xs font-bold uppercase text-soot">
            {course.difficulty}
          </span>
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-soot/80">
          {course.description}
        </p>
        <p className="mt-2 text-xs font-bold uppercase tracking-widest text-soot/60">
          {course.modules.length} modules · {formatMinutes(course.estimatedMinutes)}
        </p>
        {session?.user?.id ? (
          <div className="mt-3">
            <SetGoalButton courseId={course.id} isGoal={isGoal} />
          </div>
        ) : null}
      </div>

      <CourseProgressBar progress={course.progress} />

      {course.progress && !course.progress.done ? (
        <section className="border-2 border-ink bg-grid p-5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
            {course.progress.completed === 0 ? "Start" : "Continue"}
          </h2>
          {continueSkill ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-soot/80">
                {course.progress.completed === 0
                  ? "Begin with your first skill."
                  : "Pick up where you left off."}
              </p>
              <Link
                href={`/skill/${continueSkill.id}`}
                className="border-2 border-ink bg-complete px-4 py-2 text-sm font-bold uppercase text-soot shadow-[3px_3px_0_#1e1e1e] transition-transform hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_#1e1e1e]"
              >
                {course.progress.completed === 0 ? "Start →" : "Continue →"}
              </Link>
            </div>
          ) : null}
        </section>
      ) : null}

      {course.objectives.length > 0 ? (
        <section className="border-2 border-ink bg-cream p-5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
            What you&apos;ll learn
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {course.objectives.map((objective, i) => (
              <li key={i} className="flex gap-2 text-sm text-soot">
                <span className="text-soot/50">{i + 1}.</span>
                {objective}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="flex flex-col gap-6">
        {course.modules.map((mod) => (
          <section key={mod.id} className="border-2 border-ink bg-cream p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
                <span className="mr-2 opacity-60">{mod.order + 1}.</span>
                {mod.title}
              </h2>
            </div>
            <p className="mt-1 text-sm text-soot/70">{mod.description}</p>
            {mod.objectives.length > 0 ? (
              <ul className="mt-2 flex flex-col gap-1">
                {mod.objectives.map((objective, i) => (
                  <li key={i} className="text-xs text-soot/60">
                    · {objective}
                  </li>
                ))}
              </ul>
            ) : null}

            <ul className="mt-3 flex flex-col gap-2">
              {mod.skills.map((skill) => (
                <li key={skill.id}>
                  <Link
                    href={`/skill/${skill.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 border-2 border-ink bg-grid px-3 py-2 text-sm font-bold text-soot hover:bg-teal"
                  >
                    <span>{skill.name}</span>
                    <span className="flex items-center gap-2">
                      {skill.status ? (
                        <StatusBadge status={skill.status} />
                      ) : (
                        <span className="text-xs uppercase opacity-70">
                          {skill.difficulty}
                        </span>
                      )}
                      <span className="text-xs uppercase opacity-70">Open →</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {course.externalPrerequisites.length > 0 ? (
        <section className="border-2 border-ink bg-cream p-5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
            Skills you&apos;ll need first
          </h2>
          <p className="mt-1 text-sm text-soot/70">
            These are outside the course but unlock some of its skills:
          </p>
          <ul className="mt-2 flex flex-col gap-2">
            {course.externalPrerequisites.map((prereq) => (
              <li key={prereq.id}>
                <Link
                  href={`/skill/${prereq.id}`}
                  className="text-sm font-bold text-soot underline hover:text-soot/60"
                >
                  {prereq.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {course.progress && !course.progress.done && firstUnlocked ? (
        <section className="border-2 border-ink bg-complete p-5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
            Next up
          </h2>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-lg font-black text-soot">{firstUnlocked.name}</p>
            <Link
              href={`/skill/${firstUnlocked.id}`}
              className="border-2 border-ink bg-cream px-4 py-2 text-sm font-bold uppercase text-soot shadow-[3px_3px_0_#1e1e1e] transition-transform hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_#1e1e1e]"
            >
              Start →
            </Link>
          </div>
        </section>
      ) : null}

      {learningPath ? (
        <section className="border-2 border-ink bg-cream p-5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
            Learning path
          </h2>
          <p className="mt-1 text-sm text-soot/70">
            Work through this course skill by skill. Locked skills need
            prerequisites first.
          </p>
          <div className="mt-4">
            <LearningPathList path={learningPath} />
          </div>
        </section>
      ) : null}

      {projects.length > 0 ? (
        <section className="border-2 border-ink bg-cream p-5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
            Related projects
          </h2>
          <p className="mt-1 text-sm text-soot/70">
            Build something with the skills in this course.
          </p>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            {projects.slice(0, 4).map((project) => (
              <Link
                key={project.id}
                href={`/project/${project.id}`}
                className="flex flex-col gap-2 border-2 border-ink bg-grid px-3 py-2 hover:bg-teal"
              >
                <span className="flex items-center justify-between gap-2 text-sm font-bold text-soot">
                  {project.title}
                  {project.status === "completed" ? (
                    <span className="bg-complete px-1 text-xs uppercase">
                      Completed
                    </span>
                  ) : project.status === "in-progress" ? (
                    <span className="bg-unlocked px-1 text-xs uppercase">
                      In progress
                    </span>
                  ) : null}
                </span>
                <span className="text-xs uppercase text-soot/60">
                  {project.difficulty} · {project.progress.completed}/
                  {project.progress.total} milestones
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tones: Record<string, string> = {
    COMPLETED: "bg-complete",
    UNLOCKED: "bg-unlocked",
    LOCKED: "bg-locked",
  };
  return (
    <span
      className={`border-2 border-ink px-2 py-0.5 text-xs font-bold uppercase text-soot ${tones[status] ?? "bg-grid"}`}
    >
      {status}
    </span>
  );
}
