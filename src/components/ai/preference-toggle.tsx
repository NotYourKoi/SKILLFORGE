"use client";

import { useState } from "react";
import { setAiPreference } from "@/lib/actions";

export default function AiPreferenceToggle({ initial }: { initial: boolean }) {
  const [enabled, setEnabled] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setError(null);
    const next = !enabled;
    const res = await setAiPreference(next);
    if (res.error) {
      setError(res.error);
      return;
    }
    setEnabled(next);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold uppercase text-soot/60">AI Tutor</p>
          <p className="text-xs text-soot/60">
            {enabled ? "On — the tutor can help on lessons, exercises and quizzes." : "Off — the tutor is hidden on lessons, exercises and quizzes."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void toggle()}
          aria-pressed={enabled}
          aria-label={enabled ? "Disable AI Tutor" : "Enable AI Tutor"}
          className={`flex h-7 w-14 items-center border-2 border-ink px-0.5 transition-colors ${
            enabled ? "bg-unlocked" : "bg-grid"
          }`}
        >
          <span
            className={`h-5 w-5 border-2 border-ink bg-cream transition-transform ${
              enabled ? "translate-x-7" : "translate-x-0"
            }`}
          />
        </button>
      </div>
      {error ? <p className="text-xs font-bold text-danger">{error}</p> : null}
    </div>
  );
}
