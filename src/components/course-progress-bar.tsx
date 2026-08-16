import Link from "next/link";
import type { CourseProgress } from "@/lib/courses";

export default function CourseProgressBar({ progress }: { progress: CourseProgress | null }) {
  if (!progress) {
    return (
      <section className="border-2 border-ink bg-grid p-5">
        <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
          Course progress
        </h2>
        <p className="mt-2 text-sm text-soot/70">
          <Link className="font-bold underline" href="/register">
            Create a free account
          </Link>{" "}
          to track your progress through this course.
        </p>
      </section>
    );
  }

  return (
    <section className="border-2 border-ink bg-cream p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
          Course progress
        </h2>
        <span className="text-2xl font-black text-soot">{progress.percent}%</span>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs font-bold uppercase text-soot/70">
        <span>
          {progress.completed} of {progress.total} skills completed
        </span>
        {progress.done ? <span className="text-soot">Course complete</span> : null}
      </div>
      <div className="mt-2 h-4 border-2 border-ink bg-grid">
        <div className="h-full bg-complete" style={{ width: `${progress.percent}%` }} />
      </div>
    </section>
  );
}
