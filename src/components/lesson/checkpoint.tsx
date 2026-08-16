"use client";

import { useState } from "react";
import type { CheckpointSeed } from "../../../data/types";

export default function Checkpoint({ checkpoint }: { checkpoint: CheckpointSeed }) {
  const [selected, setSelected] = useState<number | null>(null);

  const answered = selected !== null;
  const correct = answered && selected === checkpoint.correctIndex;

  return (
    <div className="border-2 border-ink bg-cream p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-black uppercase tracking-widest text-soot">
          Check yourself
        </h3>
        {answered ? (
          <span
            className={`border-2 border-ink px-2 py-0.5 text-xs font-bold uppercase text-soot ${
              correct ? "bg-complete" : "bg-danger"
            }`}
          >
            {correct ? "Correct" : "Not quite"}
          </span>
        ) : null}
      </div>

      <p className="mt-2 text-sm font-bold leading-6 text-soot">{checkpoint.question}</p>

      <div className="mt-3 flex flex-col gap-2">
        {checkpoint.options.map((option, i) => {
          const isSelected = selected === i;
          const showCorrect = answered && i === checkpoint.correctIndex;
          const showWrong = answered && isSelected && i !== checkpoint.correctIndex;
          return (
            <button
              key={i}
              type="button"
              disabled={answered}
              aria-pressed={isSelected}
              onClick={() => setSelected(i)}
              className={`flex items-center gap-3 border-2 border-ink px-3 py-2 text-left text-sm font-bold text-soot transition-colors disabled:cursor-default ${
                showCorrect
                  ? "bg-complete"
                  : showWrong
                    ? "bg-danger"
                    : isSelected
                      ? "bg-unlocked"
                      : "bg-grid hover:bg-teal"
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center border-2 border-ink text-xs ${
                  isSelected ? "bg-soot text-cream" : "bg-cream"
                }`}
              >
                {isSelected ? "✓" : ""}
              </span>
              {option}
            </button>
          );
        })}
      </div>

      {answered ? (
        <div className="mt-3 border-t-2 border-ink pt-3">
          <p className="text-xs font-bold uppercase tracking-widest text-soot/70">
            {correct ? "Nice." : "Not quite."}
          </p>
          <p className="mt-1 text-sm leading-6 text-soot/90">{checkpoint.explanation}</p>
          {!correct ? (
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="mt-2 border-2 border-ink bg-grid px-3 py-1 text-xs font-bold uppercase text-soot hover:bg-teal"
            >
              Try again
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
