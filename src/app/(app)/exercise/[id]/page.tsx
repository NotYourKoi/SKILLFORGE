import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getExercise } from "@/lib/exercises";
import { getExecutionProvider } from "@/lib/execution";
import ExerciseRunner from "@/components/exercise/exercise-runner";

export const dynamic = "force-dynamic";

export default async function ExercisePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const exercise = await getExercise(id, session!.user!.id);

  if (!exercise) notFound();

  const relatedCourses = await prisma.course.findMany({
    where: { modules: { some: { skills: { some: { id: exercise.skill.id } } } } },
    orderBy: { title: "asc" },
    select: { slug: true, title: true, difficulty: true },
  });

  const provider = getExecutionProvider();

  const difficultyTone: Record<string, string> = {
    Easy: "bg-complete",
    Medium: "bg-unlocked",
    Hard: "bg-danger",
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/skill/${exercise.skill.id}`}
          className="text-sm font-bold uppercase text-soot/70 hover:text-soot"
        >
          ← {exercise.skill.name}
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-black uppercase tracking-tight text-soot">
            {exercise.title}
          </h1>
          <span
            className={`border-2 border-ink px-2 py-0.5 text-xs font-bold uppercase text-soot ${difficultyTone[exercise.difficulty] ?? "bg-grid"}`}
          >
            {exercise.difficulty}
          </span>
          <span className="border-2 border-ink bg-grid px-2 py-0.5 text-xs font-bold uppercase text-soot">
            {exercise.language}
          </span>
          {exercise.status?.solved ? (
            <span className="border-2 border-ink bg-complete px-2 py-0.5 text-xs font-bold uppercase text-soot">
              Solved
            </span>
          ) : exercise.status?.attempted ? (
            <span className="border-2 border-ink bg-unlocked px-2 py-0.5 text-xs font-bold uppercase text-soot">
              Attempted
            </span>
          ) : null}
        </div>
        {exercise.description ? (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-soot/80">
            {exercise.description}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          <section className="border-2 border-ink bg-cream p-5">
            <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
              Problem
            </h2>
            <p className="mt-3 text-sm leading-6 text-soot">{exercise.prompt}</p>
          </section>

          {exercise.requirements.length > 0 ? (
            <section className="border-2 border-ink bg-cream p-5">
              <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
                Requirements
              </h2>
              <ul className="mt-3 flex flex-col gap-2">
                {exercise.requirements.map((requirement, i) => (
                  <li key={i} className="flex gap-2 text-sm text-soot">
                    <span className="text-soot/50">{i + 1}.</span>
                    {requirement}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {exercise.examples.length > 0 ? (
            <section className="border-2 border-ink bg-cream p-5">
              <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
                Examples
              </h2>
              <div className="mt-3 flex flex-col gap-3">
                {exercise.examples.map((example, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <span className="text-xs font-bold uppercase text-soot/60">
                      Example {i + 1}
                    </span>
                    <pre className="whitespace-pre-wrap break-words border-2 border-ink bg-grid px-3 py-2 text-sm text-soot">
                      {example.input ? `input: ${example.input}\n` : ""}
                      {`output: ${example.output}`}
                    </pre>
                    {example.note ? (
                      <p className="text-xs text-soot/60">{example.note}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {exercise.constraints.length > 0 ? (
            <section className="border-2 border-ink bg-cream p-5">
              <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
                Constraints
              </h2>
              <ul className="mt-3 flex flex-col gap-2">
                {exercise.constraints.map((constraint, i) => (
                  <li key={i} className="flex gap-2 text-sm text-soot">
                    <span className="text-soot/50">•</span>
                    {constraint}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <div className="flex flex-col gap-4">
          <ExerciseRunner
            exerciseId={exercise.id}
            skillId={exercise.skill.id}
            language={exercise.language}
            starterCode={exercise.starterCode}
            hints={exercise.hints}
            executionMode={{
              provider: provider.name,
              executesCode: provider.executesCode,
            }}
          />
        </div>
      </div>

      {relatedCourses.length > 0 ? (
        <section className="border-2 border-ink bg-cream p-5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
            Practice with a course
          </h2>
          <p className="mt-1 text-sm text-soot/70">
            This exercise belongs to the following courses:
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {relatedCourses.map((course) => (
              <li key={course.slug}>
                <Link
                  href={`/course/${course.slug}`}
                  className="flex items-center justify-between gap-2 border-2 border-ink bg-grid px-3 py-2 text-sm font-bold text-soot hover:bg-teal"
                >
                  <span>{course.title}</span>
                  <span className="text-xs uppercase opacity-70">
                    {course.difficulty} · Open →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
