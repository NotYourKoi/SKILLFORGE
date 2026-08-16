import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getLessonReader } from "@/lib/queries";
import { getExercisesBySkill } from "@/lib/exercises";
import { formatMinutes } from "@/lib/format";
import LessonContent from "@/components/lesson/lesson-content";
import Checkpoint from "@/components/lesson/checkpoint";
import LessonNav from "@/components/lesson/lesson-nav";
import LessonComplete from "@/components/lesson-complete";
import Tutor from "@/components/ai/tutor";
import type { TutorQuickAction } from "@/components/ai/tutor";

const LESSON_TUTOR_ACTIONS: TutorQuickAction[] = [
  { mode: "EXPLAIN", label: "Explain this", prompt: "Explain this concept." },
  { mode: "EXPLAIN", label: "Give me an example", prompt: "Give me a concrete example of this concept." },
  { mode: "ASK", label: "Quiz me", prompt: "Quiz me on this topic. Ask one question at a time." },
  { mode: "ASK", label: "I'm confused", prompt: "I'm confused by this lesson. Can you re-explain it more simply?" },
];

export const dynamic = "force-dynamic";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const { id, lessonId } = await params;
  const session = await auth();
  const reader = await getLessonReader(lessonId, session!.user!.id);
  const exercises = await getExercisesBySkill(id, session!.user!.id);

  if (!reader || reader.skill.id !== id) notFound();

  const { lesson, skill, index, total, completedInSkill } = reader;
  const progressPercent = total === 0 ? 0 : Math.round((completedInSkill / total) * 100);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link
          href={`/skill/${id}`}
          className="text-sm font-bold uppercase text-soot/70 hover:text-soot"
        >
          ← {skill.name}
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-black uppercase tracking-tight text-soot">
            {lesson.title}
          </h1>
          {lesson.completed ? (
            <span className="border-2 border-ink bg-complete px-2 py-0.5 text-xs font-bold uppercase text-soot">
              Completed
            </span>
          ) : null}
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-soot/80">
          {lesson.description}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-widest text-soot/70">
          <span className="border-2 border-ink bg-grid px-2 py-0.5">
            Lesson {index + 1} of {total}
          </span>
          <span className="border-2 border-ink bg-grid px-2 py-0.5">
            {lesson.difficulty}
          </span>
          <span className="border-2 border-ink bg-grid px-2 py-0.5">
            {formatMinutes(lesson.estimatedMinutes)}
          </span>
        </div>
        <div className="mt-3 max-w-2xl">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-soot/70">
            <span>
              {completedInSkill} of {total} lessons complete
            </span>
            <span>{progressPercent}%</span>
          </div>
      <div
        role="progressbar"
        aria-label="Lessons complete in this skill"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        className="mt-1 h-2 w-full border border-ink bg-grid"
      >
        <div
          className="h-full bg-complete"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
        </div>
      </header>

      <article className="mx-auto max-w-3xl border-2 border-ink bg-cream p-6">
        <LessonContent content={lesson.content} />
      </article>

      {lesson.checkpoints.length > 0 ? (
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
            Check yourself
          </h2>
          {lesson.checkpoints.map((checkpoint, i) => (
            <Checkpoint key={i} checkpoint={checkpoint} />
          ))}
        </section>
      ) : null}

      {exercises.length > 0 ? (
        <section className="border-2 border-ink bg-cream p-5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
            Try it yourself
          </h2>
          <p className="mt-2 text-sm text-soot/80">
            Put this lesson into practice with a short coding exercise.
          </p>
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
                  Practice →
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <Tutor lessonId={lesson.id} skillId={id} quickActions={LESSON_TUTOR_ACTIONS} />

      {lesson.completed ? (
        <section className="flex flex-col gap-3 border-2 border-ink bg-complete/40 p-5">
          <p className="text-sm font-black uppercase tracking-widest text-soot">
            Lesson complete — good work!
          </p>
          <p className="text-xs leading-5 text-soot/80">
            This lesson is recorded in your progress.
          </p>
          <LessonComplete lessonId={lesson.id} skillId={id} completed={true} />
        </section>
      ) : (
        <section className="flex flex-col gap-2">
          <p className="text-xs leading-5 text-soot/70">
            Finished? Mark the lesson complete so it is saved to your progress.
          </p>
          <LessonComplete lessonId={lesson.id} skillId={id} completed={false} />
        </section>
      )}

      <LessonNav reader={reader} />

      <Link
        href={`/skill/${id}`}
        className="w-fit text-sm font-bold uppercase text-soot/70 hover:text-soot"
      >
        ← Back to skill
      </Link>
    </div>
  );
}