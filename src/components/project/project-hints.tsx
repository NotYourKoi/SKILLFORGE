"use client";

import { useState } from "react";

/**
 * Progressive hints: revealed one at a time, on demand. The full solution is
 * never exposed.
 */
export default function ProjectHints({ hints }: { hints: string[] }) {
  const [shown, setShown] = useState(0);
  const allShown = shown >= hints.length;

  if (hints.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-bold uppercase tracking-widest text-soot/70">
        Hints
      </span>
      {hints.slice(0, shown).map((hint, index) => (
        <p
          key={index}
          className="border-l-2 border-ink bg-grid px-3 py-2 text-sm text-soot"
        >
          <span className="font-black">Hint {index + 1}:</span> {hint}
        </p>
      ))}
      {!allShown ? (
        <button
          type="button"
          onClick={() => setShown((n) => n + 1)}
          className="w-fit border-2 border-ink bg-cream px-3 py-1 text-xs font-bold uppercase text-soot hover:bg-grid"
        >
          {shown === 0 ? "Show a hint" : "Show next hint"}
        </button>
      ) : null}
    </div>
  );
}
