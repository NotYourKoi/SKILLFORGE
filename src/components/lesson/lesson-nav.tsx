import Link from "next/link";
import type { LessonReader } from "@/lib/queries";

export default function LessonNav({ reader }: { reader: LessonReader }) {
  const { skill, index, total, prevLesson, nextLesson, quiz, nextSkill, status } = reader;
  const skillCompleted = status === "COMPLETED";

  const primary: { href: string; label: string; tone: string } | null = nextLesson
    ? {
        href: `/skill/${skill.id}/lesson/${nextLesson.id}`,
        label: `Next lesson: ${nextLesson.title}`,
        tone: "bg-complete",
      }
    : !skillCompleted && quiz
      ? {
          href: `/skill/${skill.id}/quiz/${quiz.id}`,
          label: `Continue to Quiz: ${quiz.title}`,
          tone: "bg-unlocked",
        }
      : nextSkill
        ? {
            href: `/skill/${nextSkill.id}`,
            label: `Continue to next skill: ${nextSkill.name}`,
            tone: "bg-unlocked",
          }
        : null;

  return (
    <nav aria-label="Lesson navigation" className="flex flex-col gap-4">
      {primary ? (
        <Link
          href={primary.href}
          className={`w-fit border-2 border-ink px-4 py-3 text-sm font-black uppercase text-soot shadow-[4px_4px_0_#1e1e1e] transition-transform hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_#1e1e1e] ${primary.tone}`}
        >
          {primary.label} →
        </Link>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {prevLesson ? (
          <Link
            href={`/skill/${skill.id}/lesson/${prevLesson.id}`}
            className="border-2 border-ink bg-cream px-3 py-2 text-sm font-bold uppercase text-soot hover:bg-grid"
          >
            ← Previous lesson
          </Link>
        ) : (
          <span />
        )}
        <span className="text-xs font-bold uppercase tracking-widest text-soot/70">
          Lesson {index + 1} of {total}
        </span>
      </div>
    </nav>
  );
}
