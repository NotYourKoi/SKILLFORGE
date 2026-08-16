import Link from "next/link";
import { formatMinutes } from "@/lib/format";
import type { CourseSummary } from "@/lib/courses";

export default function CourseCard({ course }: { course: CourseSummary }) {
  const percent = course.progress?.percent ?? 0;

  return (
    <Link
      href={`/course/${course.slug}`}
      className="flex flex-col gap-3 border-2 border-ink bg-cream p-4 shadow-[4px_4px_0_#1e1e1e] transition-transform hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#1e1e1e]"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="border-2 border-ink bg-teal px-2 py-0.5 text-xs font-bold uppercase text-soot">
          {course.category}
        </span>
        <span className="border-2 border-ink bg-grid px-2 py-0.5 text-xs font-bold uppercase text-soot">
          {course.difficulty}
        </span>
      </div>

      <h2 className="text-lg font-black uppercase leading-tight tracking-tight text-soot">
        {course.title}
      </h2>
      <p className="text-sm leading-6 text-soot/75">{course.description}</p>

      <p className="text-xs font-bold uppercase tracking-widest text-soot/60">
        {course.moduleCount} modules · {course.skillCount} skills ·{" "}
        {formatMinutes(course.estimatedMinutes)}
      </p>

      {course.progress ? (
        <div>
          <div className="flex items-center justify-between text-xs font-bold uppercase text-soot">
            <span>Your progress</span>
            <span>{percent}%</span>
          </div>
          <div className="mt-1 h-3 border-2 border-ink bg-grid">
            <div className="h-full bg-complete" style={{ width: `${percent}%` }} />
          </div>
        </div>
      ) : (
        <p className="text-xs font-bold uppercase tracking-widest text-soot/60">
          Free to start
        </p>
      )}
    </Link>
  );
}
