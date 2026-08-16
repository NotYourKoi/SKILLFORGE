"use client";

import { useActionState, useState } from "react";
import { completeLesson } from "@/lib/actions";
import type { GamificationFeedback } from "@/lib/progression";
import Feedback from "@/components/gamification/feedback";

export default function LessonComplete({
  lessonId,
  skillId,
  completed,
}: {
  lessonId: string;
  skillId: string;
  completed: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    async (_prev: {
      error?: string;
      result?: { completed: boolean; feedback: GamificationFeedback };
    }) => completeLesson(lessonId, skillId),
    {},
  );
  const [armed, setArmed] = useState(false);

  if (completed) {
    return (
      <form action={formAction} className="flex flex-col items-start gap-2">
        {armed ? (
          <p className="text-xs font-bold text-soot">
            Click again to confirm — this will unmark the lesson.
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          onClick={(event) => {
            if (!armed) {
              event.preventDefault();
              setArmed(true);
            }
          }}
          className={`border-2 border-ink px-4 py-2 text-xs font-bold uppercase text-soot transition-transform enabled:hover:translate-x-0.5 enabled:hover:translate-y-0.5 disabled:opacity-60 ${
            armed ? "bg-danger shadow-[3px_3px_0_#1e1e1e]" : "bg-grid"
          }`}
        >
          {pending ? "Working..." : armed ? "Confirm: mark incomplete" : "Mark lesson incomplete"}
        </button>
        {state.error ? (
          <p className="border-2 border-ink bg-danger px-2 py-1 text-xs font-bold text-soot">
            {state.error}
          </p>
        ) : null}
        {state.result?.feedback ? <Feedback feedback={state.result.feedback} /> : null}
      </form>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <button
        type="submit"
        disabled={pending}
        className="border-2 border-ink bg-complete px-4 py-3 font-bold uppercase text-soot shadow-[4px_4px_0_#1e1e1e] transition-transform enabled:hover:translate-x-0.5 enabled:hover:translate-y-0.5 enabled:hover:shadow-[2px_2px_0_#1e1e1e] disabled:opacity-60"
      >
        {pending ? "Working..." : "Mark lesson complete"}
      </button>
      {state.error ? (
        <p className="border-2 border-ink bg-danger px-2 py-1 text-xs font-bold text-soot">
          {state.error}
        </p>
      ) : null}
      {state.result?.feedback ? <Feedback feedback={state.result.feedback} /> : null}
    </form>
  );
}
