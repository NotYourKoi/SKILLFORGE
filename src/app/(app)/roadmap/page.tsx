import Link from "next/link";
import { auth } from "@/auth";
import { getRoadmap } from "@/lib/queries";
import RoadmapTree from "@/components/roadmap-tree";

export const dynamic = "force-dynamic";

export default async function RoadmapPage() {
  const session = await auth();
  const skills = await getRoadmap(session!.user!.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-soot">
            Roadmap
          </h1>
          <p className="mt-1 text-sm text-soot/70">
            Complete prerequisites to unlock nodes. Click a node for details.
          </p>
        </div>
        <div className="flex items-center gap-4 border-2 border-ink bg-cream px-3 py-2 text-xs font-bold uppercase text-soot">
          <LegendDot tone="bg-complete" label="Completed" />
          <LegendDot tone="bg-unlocked" label="Unlocked" />
          <LegendDot tone="bg-locked" label="Locked" />
        </div>
      </div>

      <div
        role="region"
        aria-label="Roadmap map — scroll horizontally to explore"
        tabIndex={0}
        className="overflow-x-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-unlocked"
      >
        <RoadmapTree skills={skills} />
      </div>

      <details className="border-2 border-ink bg-cream">
        <summary className="cursor-pointer px-4 py-3 text-sm font-bold uppercase tracking-widest text-soot hover:bg-grid">
          View skills as a list
        </summary>
        <ul className="flex flex-col border-t-2 border-ink">
          {skills.map((skill) => (
            <li key={skill.id} className="flex items-center justify-between gap-3 border-b border-ink/30 px-4 py-2 last:border-b-0">
              <Link
                href={`/skill/${skill.id}`}
                className="text-sm font-bold text-soot hover:underline"
              >
                {skill.name}
              </Link>
              <span
                className={`border border-ink px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-soot ${
                  statusTone[skill.status]
                }`}
              >
                {statusLabel[skill.status]}
              </span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

const statusLabel: Record<string, string> = {
  COMPLETED: "Completed",
  UNLOCKED: "Unlocked",
  LOCKED: "Locked",
};

const statusTone: Record<string, string> = {
  COMPLETED: "bg-complete",
  UNLOCKED: "bg-unlocked",
  LOCKED: "bg-locked",
};

function LegendDot({ tone, label }: { tone: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-3 w-3 border border-ink ${tone}`} />
      {label}
    </span>
  );
}
