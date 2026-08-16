"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useActionState } from "react";
import { addGoal } from "@/lib/actions";

interface SetGoalButtonProps {
  courseId: string;
  isGoal: boolean;
}

export default function SetGoalButton({ courseId, isGoal }: SetGoalButtonProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(addGoal, {});

  useEffect(() => {
    if (state.result) router.refresh();
  }, [state.result, router]);

  if (isGoal) {
    return (
      <span className="border-2 border-ink bg-complete px-4 py-2 text-sm font-bold uppercase text-soot">
        ✓ Goal set
      </span>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="note" value="" />
      <button
        type="submit"
        disabled={pending}
        className="border-2 border-ink bg-unlocked px-4 py-2 text-sm font-bold uppercase text-soot shadow-[3px_3px_0_#1e1e1e] transition-transform enabled:hover:translate-x-0.5 enabled:hover:translate-y-0.5 enabled:hover:shadow-[1px_1px_0_#1e1e1e] disabled:opacity-60"
      >
        {pending ? "Saving..." : "Set as goal"}
      </button>
      {state.error ? (
        <span className="text-xs font-bold text-danger">{state.error}</span>
      ) : null}
    </form>
  );
}
