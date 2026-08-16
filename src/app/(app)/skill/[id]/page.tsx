import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getSkillDetail } from "@/lib/queries";
import { getExercisesBySkill } from "@/lib/exercises";
import { getProjectsBySkill } from "@/lib/projects";
import SkillToggle from "@/components/skill-toggle";
import Tutor from "@/components/ai/tutor";

export const dynamic = "force-dynamic";

export default async function SkillPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const skill = await getSkillDetail(id, session!.user!.id);
  const exercises = await getExercisesBySkill(id, session!.user!.id);
  const projects = await getProjectsBySkill(id, session!.user!.id);
  const relatedCourses = await prisma.course.findMany({
    where: { modules: { some: { skills: { some: { id } } } } },
    orderBy: { title: "asc" },
    select: { slug: true, title: true, difficulty: true },
  });

  if (!skill) notFound();

  const objectives = skill.objectives;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/roadmap"
          className="text-sm font-bold uppercase text-soot/70 hover:text-soot"
        >
          ← Roadmap
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-black uppercase tracking-tight text-soot">
            {skill.name}
          </h1>
          <StatusBadge status={skill.status} />
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-soot/80">
          {skill.description}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <section className="border-2 border-ink bg-cream p-5">
            <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
              Learning objectives
            </h2>
            {objectives.length === 0 ? (
              <p className="mt-3 text-sm text-soot/70">No objectives listed.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {objectives.map((objective, i) => (
                  <li key={i} className="flex gap-2 text-sm text-soot">
                    <span className="text-soot/50">{i + 1}.</span>
                    {objective}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="border-2 border-ink bg-cream p-5">
            <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
              Lessons
            </h2>
            {skill.lessons.length === 0 ? (
              <p className="mt-3 text-sm text-soot/70">No lessons yet.</p>
            ) : (
              <ol className="mt-3 flex flex-col gap-2">
                {skill.lessons.map((lesson, i) => (
                  <li key={lesson.id}>
                    <Link
                      href={`/skill/${skill.id}/lesson/${lesson.id}`}
                      className="flex items-center justify-between border-2 border-ink bg-grid px-3 py-2 text-sm font-bold text-soot hover:bg-teal"
                    >
                      <span>
                        <span className="mr-2 opacity-60">{i + 1}.</span>
                        {lesson.title}
                      </span>
                      <span className="text-xs uppercase opacity-70">Read →</span>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="border-2 border-ink bg-cream p-5">
            <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
              Exercises
            </h2>
            {exercises.length === 0 ? (
              <p className="mt-3 text-sm text-soot/70">
                No exercises yet — check back soon.
              </p>
            ) : (
              <div className="mt-3 flex flex-col gap-2">
                {exercises.map((exercise) => (
                  <Link
                    key={exercise.id}
                    href={`/exercise/${exercise.id}`}
                    className="flex items-center justify-between gap-2 border-2 border-ink bg-grid px-3 py-2 text-sm font-bold text-soot hover:bg-teal"
                  >
                    <span>{exercise.title}</span>
                    <span className="flex items-center gap-2 text-xs uppercase opacity-70">
                      {exercise.status?.solved ? (
                        <span className="bg-complete px-1">Solved</span>
                      ) : exercise.status?.attempted ? (
                        <span className="bg-unlocked px-1">Attempted</span>
                      ) : null}
                      {exercise.difficulty}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="border-2 border-ink bg-cream p-5">
            <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
              Projects
            </h2>
            {projects.length === 0 ? (
              <p className="mt-3 text-sm text-soot/70">
                No projects tied to this skill yet.
              </p>
            ) : (
              <div className="mt-3 flex flex-col gap-2">
                {projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/project/${project.id}`}
                    className="flex items-center justify-between gap-2 border-2 border-ink bg-grid px-3 py-2 text-sm font-bold text-soot hover:bg-teal"
                  >
                    <span>{project.title}</span>
                    <span className="flex items-center gap-2 text-xs uppercase opacity-70">
                      {project.status === "completed" ? (
                        <span className="bg-complete px-1">Completed</span>
                      ) : project.status === "in-progress" ? (
                        <span className="bg-unlocked px-1">In progress</span>
                      ) : null}
                      {project.progress.completed}/{project.progress.total} · Build →
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="border-2 border-ink bg-cream p-5">
            <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
              Quizzes
            </h2>
            {skill.quizzes.length === 0 ? (
              <p className="mt-3 text-sm text-soot/70">No quizzes yet.</p>
            ) : (
              <div className="mt-3 flex flex-col gap-2">
                {skill.quizzes.map((quiz) => (
                  <Link
                    key={quiz.id}
                    href={`/skill/${skill.id}/quiz/${quiz.id}`}
                    className="flex items-center justify-between border-2 border-ink bg-grid px-3 py-2 text-sm font-bold text-soot hover:bg-teal"
                  >
                    <span>{quiz.title}</span>
                    <span className="text-xs uppercase opacity-70">
                      {quiz.questionCount} questions · pass {quiz.passScore}%
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-6">
          <section className="border-2 border-ink bg-cream p-5">
            <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
              Info
            </h2>
            <dl className="mt-3 flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-soot/60">Tier</dt>
                <dd className="font-bold text-soot">{skill.tier}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-soot/60">Status</dt>
                <dd className="font-bold text-soot">{skill.status}</dd>
              </div>
            </dl>
          </section>

          <section className="border-2 border-ink bg-cream p-5">
            <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
              Prerequisites
            </h2>
            {skill.prereqs.length === 0 ? (
              <p className="mt-3 text-sm text-soot/70">
                This is a starting skill.
              </p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {skill.prereqs.map((prereq) => (
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
            )}
          </section>

          <section className="border-2 border-ink bg-cream p-5">
            <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
              Unlocks
            </h2>
            {skill.dependents.length === 0 ? (
              <p className="mt-3 text-sm text-soot/70">
                No dependent skills.
              </p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {skill.dependents.map((dependent) => (
                  <li key={dependent.id}>
                    <Link
                      href={`/skill/${dependent.id}`}
                      className="text-sm font-bold text-soot underline hover:text-soot/60"
                    >
                      {dependent.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="border-2 border-ink bg-cream p-5">
            <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
              Related courses
            </h2>
            {relatedCourses.length === 0 ? (
              <p className="mt-3 text-sm text-soot/70">
                No courses include this skill yet.
              </p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {relatedCourses.map((course) => (
                  <li key={course.slug}>
                    <Link
                      href={`/course/${course.slug}`}
                      className="flex items-center justify-between gap-2 text-sm font-bold text-soot underline hover:text-soot/60"
                    >
                      <span>{course.title}</span>
                      <span className="text-xs uppercase opacity-70">
                        {course.difficulty}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <SkillToggle skillId={skill.id} status={skill.status} />
        </aside>
      </div>

      <Tutor skillId={skill.id} title="Ask about this skill" />
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
