"use client";

import { useState } from "react";
import { toggleProjectCompletion } from "@/lib/actions";
import type { GamificationFeedback } from "@/lib/progression";
import Feedback from "@/components/gamification/feedback";

/** Manual project completion toggle (fallback for projects without milestones). */
export default function ProjectComplete({
  projectId,
  completed,
}: {
  projectId: string;
  completed: boolean;
}) {
  const [isCompleted, setIsCompleted] = useState(completed);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<GamificationFeedback | null>(null);

  async function handleToggle() {
    setBusy(true);
    setError(null);
    setFeedback(null);
    const res = await toggleProjectCompletion(projectId);
    if (res.error) {
      setError(res.error);
    } else if (res.result) {
      setIsCompleted(res.result.completed);
      setFeedback(res.result);
    }
    setBusy(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleToggle}
        disabled={busy}
        className={`border-2 border-ink px-4 py-2 text-sm font-bold uppercase text-soot shadow-[3px_3px_0_#1e1e1e] transition-transform hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_#1e1e1e] disabled:cursor-not-allowed disabled:opacity-50 ${
          isCompleted ? "bg-complete" : "bg-grid"
        }`}
      >
        {busy
          ? "Saving..."
          : isCompleted
            ? "Mark as in progress"
            : "Mark project complete"}
      </button>
      {error ? (
        <p className="border-2 border-ink bg-danger px-3 py-2 text-sm font-bold text-soot">
          {error}
        </p>
      ) : null}
      {feedback ? <Feedback feedback={feedback} /> : null}
    </div>
  );
}
