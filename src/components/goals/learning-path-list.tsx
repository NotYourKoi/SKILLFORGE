import Link from "next/link";
import type { LearningPath } from "@/lib/learning-path";

const STATUS_TONES: Record<string, string> = {
  COMPLETED: "bg-complete",
  NEXT: "bg-unlocked",
  CURRENT: "bg-teal",
  LOCKED: "bg-locked",
};

export default function LearningPathList({ path }: { path: LearningPath }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs font-bold uppercase tracking-widest text-soot/60">
        {path.completed} of {path.total} skills completed
      </p>

      {path.modules.map((mod) => (
        <div key={mod.id} className="flex flex-col gap-2">
          <h3 className="text-sm font-bold uppercase tracking-widest text-soot">
            <span className="mr-2 opacity-60">{mod.order + 1}.</span>
            {mod.title}
          </h3>
          <ul className="flex flex-col gap-2">
            {mod.skills.map((skill) => {
              const blockers = skill.prerequisites.filter((prereq) => !prereq.satisfied);
              return (
                <li key={skill.skillId}>
                  <Link
                    href={`/skill/${skill.skillId}`}
                    className="flex flex-col gap-1 border-2 border-ink bg-grid px-3 py-2 hover:bg-teal"
                  >
                    <span className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-bold text-soot">
                        {skill.skillName}
                      </span>
                      <span
                        className={`border-2 border-ink px-2 py-0.5 text-xs font-bold uppercase text-soot ${STATUS_TONES[skill.status] ?? "bg-grid"}`}
                      >
                        {skill.status}
                      </span>
                    </span>
                    {blockers.length > 0 ? (
                      <span className="text-xs text-soot/70">
                        Needs:{" "}
                        {blockers.map((prereq) => prereq.skillName).join(", ")}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
