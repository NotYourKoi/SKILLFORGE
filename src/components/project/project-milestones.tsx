"use client";

import { useState } from "react";
import { toggleProjectMilestone } from "@/lib/actions";
import type { GamificationFeedback } from "@/lib/progression";
import Feedback from "@/components/gamification/feedback";

interface MilestoneView {
  index: number;
  title: string;
  completed: boolean;
  completedAt: Date | null;
}

export default function ProjectMilestones({
  projectId,
  milestones,
}: {
  projectId: string;
  milestones: MilestoneView[];
}) {
  const [items, setItems] = useState(milestones);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<GamificationFeedback | null>(null);

  const doneCount = items.filter((item) => item.completed).length;
  const total = items.length;
  const percent = total === 0 ? 0 : Math.round((doneCount / total) * 100);

  async function toggle(index: number) {
    setBusy(true);
    setError(null);
    setFeedback(null);
    const res = await toggleProjectMilestone(projectId, index);
    if (res.error) {
      setError(res.error);
    } else if (res.result) {
      setItems((prev) =>
        prev.map((item) =>
          item.index === index
            ? { ...item, completed: res.result!.completed }
            : item,
        ),
      );
      setFeedback(res.result);
    }
    setBusy(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-soot/70">
          <span>
            {doneCount} of {total} milestones complete
          </span>
          <span>{percent}%</span>
        </div>
        <div className="mt-1 h-3 w-full border-2 border-ink bg-grid">
          <div
            className="h-full bg-complete transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <ol className="flex flex-col gap-2">
        {items.map((item, i) => (
          <li key={item.index}>
            <button
              type="button"
              onClick={() => toggle(item.index)}
              disabled={busy}
              className={`flex w-full items-start gap-3 border-2 border-ink px-3 py-2 text-left text-sm font-bold text-soot transition-colors disabled:opacity-60 ${
                item.completed ? "bg-complete/40" : "bg-cream hover:bg-grid"
              }`}
            >
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border-2 border-ink text-xs ${
                  item.completed ? "bg-unlocked" : "bg-cream"
                }`}
              >
                {item.completed ? "✓" : i + 1}
              </span>
              <span className="leading-5">{item.title}</span>
            </button>
          </li>
        ))}
      </ol>

      {error ? (
        <p className="border-2 border-ink bg-danger px-3 py-2 text-sm font-bold text-soot">
          {error}
        </p>
      ) : null}

      {feedback ? <Feedback feedback={feedback} /> : null}
    </div>
  );
}
