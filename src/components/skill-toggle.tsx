"use client";

import { useActionState } from "react";
import { toggleSkill } from "@/lib/actions";
import type { GamificationFeedback } from "@/lib/progression";
import Feedback from "@/components/gamification/feedback";

export default function SkillToggle({
  skillId,
  status,
}: {
  skillId: string;
  status: string;
}) {
  const [state, formAction, pending] = useActionState(
    async (_prev: {
      error?: string;
      result?: { completed: boolean; feedback: GamificationFeedback };
    }) => toggleSkill(skillId),
    {},
  );

  const isCompleted = status === "COMPLETED";
  const isLocked = status === "LOCKED";

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <button
        type="submit"
        disabled={pending}
        className={`w-full border-2 border-ink px-4 py-3 font-bold uppercase text-soot shadow-[4px_4px_0_#1e1e1e] transition-transform enabled:hover:translate-x-0.5 enabled:hover:translate-y-0.5 enabled:hover:shadow-[2px_2px_0_#1e1e1e] disabled:opacity-60 ${
          isCompleted ? "bg-danger" : isLocked ? "bg-locked" : "bg-complete"
        }`}
      >
        {pending
          ? "Working..."
          : isCompleted
            ? "Mark incomplete"
            : isLocked
              ? "Locked"
              : "Mark complete"}
      </button>
      {isLocked ? (
        <p className="text-xs text-soot/60">
          Complete the prerequisite skills first.
        </p>
      ) : null}
      {state.error ? (
        <p className="border-2 border-ink bg-danger px-2 py-1 text-xs font-bold text-soot">
          {state.error}
        </p>
      ) : null}
      {state.result?.feedback ? <Feedback feedback={state.result.feedback} /> : null}
    </form>
  );
}
