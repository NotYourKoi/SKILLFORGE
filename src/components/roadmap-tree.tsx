"use client";

import Link from "next/link";
import { useActionState } from "react";
import { toggleSkill } from "@/lib/actions";
import type { RoadmapSkill } from "@/lib/queries";

const NODE_WIDTH = 172;
const NODE_HEIGHT = 72;

const statusColors: Record<RoadmapSkill["status"], string> = {
  COMPLETED: "bg-complete",
  UNLOCKED: "bg-unlocked",
  LOCKED: "bg-locked",
};

export default function RoadmapTree({ skills }: { skills: RoadmapSkill[] }) {
  const maxX = Math.max(...skills.map((s) => s.x)) + NODE_WIDTH + 24;
  const maxY = Math.max(...skills.map((s) => s.y)) + NODE_HEIGHT + 24;

  const byId = new Map(skills.map((s) => [s.id, s]));
  const center = (skill: RoadmapSkill) => ({
    x: skill.x + NODE_WIDTH / 2,
    y: skill.y + NODE_HEIGHT / 2,
  });

  const connectors = skills.flatMap((skill) =>
    skill.prereqIds.flatMap((prereqId) => {
      const prereq = byId.get(prereqId);
      if (!prereq) return [];
      const from = center(prereq);
      const to = center(skill);
      return [{ from, to, key: `${prereqId}-${skill.id}` }];
    }),
  );

  return (
    <div className="relative border-2 border-ink bg-grid" style={{ width: maxX, height: maxY }}>
      <svg className="absolute inset-0" width={maxX} height={maxY} aria-hidden="true">
        {connectors.map((c) => (
          <line
            key={c.key}
            x1={c.from.x}
            y1={c.from.y}
            x2={c.to.x}
            y2={c.to.y}
            stroke="#1e1e1e"
            strokeWidth={2}
            strokeDasharray="4 4"
          />
        ))}
      </svg>

      {skills.map((skill) => (
        <NodeCard key={skill.id} skill={skill} />
      ))}
    </div>
  );
}

function NodeCard({ skill }: { skill: RoadmapSkill }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string }) => toggleSkill(skill.id),
    {},
  );

  return (
    <div
      className="absolute flex flex-col border-2 border-ink"
      style={{
        left: skill.x,
        top: skill.y,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        backgroundColor: "inherit",
      }}
    >
      <div className="flex h-full flex-col bg-grid">
        <Link
          href={`/skill/${skill.id}`}
          className={`flex h-full flex-col px-2 py-1 ${statusColors[skill.status]}`}
          title={skill.description}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">
              {skill.tier}
            </span>
            <StatusGlyph status={skill.status} />
          </div>
          <span className="mt-auto truncate text-[11px] font-black uppercase leading-tight text-soot">
            {skill.name}
          </span>
        </Link>
        <form action={formAction} className="border-t-2 border-ink">
          <button
            type="submit"
            disabled={pending}
            className="w-full bg-cream px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-soot hover:bg-teal disabled:opacity-60"
          >
            {pending ? "..." : skill.status === "COMPLETED" ? "Undo" : "Toggle"}
          </button>
        </form>
      </div>

      {state.error ? (
        <div className="absolute right-0 top-full z-10 mt-1 border-2 border-ink bg-danger px-2 py-1 text-[10px] font-bold text-soot">
          {state.error}
        </div>
      ) : null}
    </div>
  );
}

function StatusGlyph({ status }: { status: RoadmapSkill["status"] }) {
  if (status === "COMPLETED") {
    return (
      <span className="text-xs font-black text-soot" aria-label="Completed">
        ✓
      </span>
    );
  }
  if (status === "LOCKED") {
    return (
      <svg
        className="h-3 w-3 text-soot"
        viewBox="0 0 16 16"
        fill="none"
        aria-label="Locked"
      >
        <rect x="3" y="7" width="10" height="7" fill="currentColor" />
        <path
          d="M5 7V5a3 3 0 0 1 6 0v2"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    );
  }
  return <span className="text-xs text-soot" aria-label="Unlocked" />;
}
