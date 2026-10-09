"use client";

import { useState, useEffect, useRef } from "react";
import type { OwnershipScenario } from "@/lib/visualizers/types";
import { retroAudio } from "@/lib/audio/retro-audio";

export default function OwnershipVisualizer({
  scenario,
}: {
  scenario: OwnershipScenario;
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const step = scenario.steps[currentStepIndex] || scenario.steps[0];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === scenario.steps.length - 1;

  useEffect(() => {
    setIsMuted(retroAudio.isMuted());
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mediaQuery.matches);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      if (isLast) {
        setIsPlaying(false);
        return;
      }
      autoPlayTimerRef.current = setTimeout(() => {
        handleNext();
      }, reduceMotion ? 1800 : 2500);
    }
    return () => {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
    };
  }, [isPlaying, currentStepIndex, isLast, reduceMotion]);

  const handleNext = () => {
    if (!isLast) {
      const nextIdx = currentStepIndex + 1;
      const nextStep = scenario.steps[nextIdx];
      setCurrentStepIndex(nextIdx);
      if (nextStep.ruleViolated) {
        retroAudio.playError();
      } else {
        retroAudio.playStep();
      }
    } else {
      setIsPlaying(false);
      retroAudio.playSuccess();
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStepIndex((prev) => prev - 1);
      retroAudio.playStep();
    }
  };

  const handleFirst = () => {
    setCurrentStepIndex(0);
    retroAudio.playStep();
  };

  const handleLast = () => {
    setCurrentStepIndex(scenario.steps.length - 1);
    retroAudio.playStep();
  };

  const toggleSound = () => {
    const next = retroAudio.toggleMute();
    setIsMuted(next);
    if (!next) {
      retroAudio.playStep();
    }
  };

  return (
    <div className="flex flex-col border-2 border-ink bg-cream font-mono text-soot shadow-[4px_4px_0px_#1e1e1e]">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink bg-teal px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="border-2 border-ink bg-soot px-1.5 py-0.5 text-[10px] font-black uppercase text-cream">
            RUST BORROW CHECKER
          </span>
          <span className="text-xs font-black uppercase tracking-wider text-soot">
            {scenario.title}
          </span>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setReduceMotion(!reduceMotion)}
            className={`border-2 border-ink px-2 py-0.5 text-[10px] font-bold uppercase transition-colors ${
              reduceMotion ? "bg-unlocked text-cream" : "bg-cream text-soot"
            }`}
          >
            Motion: {reduceMotion ? "Reduced" : "Normal"}
          </button>
          <button
            type="button"
            onClick={toggleSound}
            className="border-2 border-ink bg-cream px-2 py-0.5 text-[10px] font-bold uppercase hover:bg-grid"
          >
            Sound: {isMuted ? "Muted 🔇" : "On 🔊"}
          </button>
        </div>
      </div>

      {/* Main interactive stage */}
      <div className="grid grid-cols-1 gap-3 p-3 lg:grid-cols-12">
        {/* Left: Source code & active line */}
        <div className="flex flex-col border-2 border-ink bg-grid p-2.5 lg:col-span-5">
          <div className="mb-2 flex items-center justify-between border-b-2 border-ink pb-1">
            <span className="text-[11px] font-black uppercase tracking-widest text-soot">
              Rust Code
            </span>
            <span className="text-[10px] font-bold uppercase text-soot/70">
              Line {step.codeLine}
            </span>
          </div>

          <div className="flex flex-col gap-0.5 text-xs">
            {scenario.code.map((line, idx) => {
              const lineNum = idx + 1;
              const isActive = lineNum === step.codeLine;
              const isComment = line.trim().startsWith("//");
              return (
                <div
                  key={lineNum}
                  className={`flex items-center gap-2 px-1.5 py-0.5 transition-colors ${
                    isActive
                      ? "border border-ink bg-unlocked font-bold text-cream"
                      : isComment
                      ? "text-soot/60 italic"
                      : "text-soot/90"
                  }`}
                >
                  <span className="w-5 shrink-0 text-right text-[10px] opacity-60">
                    {lineNum}
                  </span>
                  <code className="whitespace-pre">{line}</code>
                </div>
              );
            })}
          </div>

          {/* Action indicator */}
          <div className="mt-3 flex items-center justify-between border-t-2 border-ink pt-2">
            <span className="text-[10px] font-bold uppercase text-soot/70">
              Action
            </span>
            <span
              className={`border-2 border-ink px-1.5 py-0.5 text-[10px] font-black uppercase ${
                step.activeAction === "DROP" || step.ruleViolated
                  ? "bg-danger text-cream"
                  : step.activeAction === "MOVE"
                  ? "bg-locked text-soot"
                  : "bg-complete text-soot"
              }`}
            >
              {step.activeAction}
            </span>
          </div>
        </div>

        {/* Right: Ownership and Resource Map */}
        <div className="flex flex-col gap-3 lg:col-span-7">
          {/* Target Heap Resource Card */}
          <div className="border-2 border-ink bg-cream p-2.5">
            <div className="mb-2 flex items-center justify-between border-b-2 border-ink pb-1">
              <span className="text-[11px] font-black uppercase tracking-widest text-soot">
                Heap Resource Pool 💎
              </span>
              <span className="text-[10px] font-bold uppercase text-soot/70">
                Single Owner Invariant
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {step.resources.map((res) => (
                <div
                  key={res.id}
                  className={`flex flex-col border-2 border-ink p-2 ${
                    res.isDropped ? "border-dashed bg-danger/20" : "bg-grid"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black">RESOURCE: {res.label}</span>
                    <span className="text-[10px] opacity-70">{res.heapAddress}</span>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="font-bold text-soot/80">Owner:</span>
                    {res.currentOwner ? (
                      <span className="border border-ink bg-complete px-1.5 py-0.2 text-[10px] font-black uppercase">
                        👑 {res.currentOwner}
                      </span>
                    ) : (
                      <span className="border border-ink bg-locked px-1.5 py-0.2 text-[10px] font-bold uppercase">
                        None / Dropped
                      </span>
                    )}

                    {res.activeBorrows.length > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-soot/80">Active Borrows:</span>
                        {res.activeBorrows.map((b, bIdx) => (
                          <span
                            key={bIdx}
                            className={`border border-ink px-1 py-0.2 text-[10px] font-bold uppercase ${
                              b.kind === "mutable"
                                ? "bg-danger text-cream"
                                : "bg-unlocked text-cream"
                            }`}
                          >
                            {b.kind === "mutable" ? "✎ &mut " : "👁 & "}
                            {b.borrower}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Variables & Handles Status Grid */}
          <div className="border-2 border-ink bg-cream p-2.5">
            <div className="mb-2 flex items-center justify-between border-b-2 border-ink pb-1">
              <span className="text-[11px] font-black uppercase tracking-widest text-soot">
                Active Variable Bindings 🏷️
              </span>
              <span className="text-[10px] font-bold uppercase text-soot/70">
                Scope View
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {step.variables.map((v, vIdx) => {
                const isMoved = v.state === "MOVED_INVALID";
                const isOwner = v.state === "OWNER";
                const isImmBorrow = v.state === "BORROWED_IMMUTABLE";
                const isMutBorrow = v.state === "BORROWED_MUTABLE";

                return (
                  <div
                    key={vIdx}
                    className={`flex flex-col border-2 border-ink p-2 text-xs transition-all ${
                      isMoved
                        ? "border-dashed border-ink/50 bg-locked/30 opacity-60"
                        : v.isHighlighted
                        ? "bg-teal/40 font-bold"
                        : "bg-grid"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm">{v.name}</span>
                      <span
                        className={`border border-ink px-1 py-0.2 text-[9px] font-black uppercase ${
                          isOwner
                            ? "bg-complete text-soot"
                            : isImmBorrow
                            ? "bg-unlocked text-cream"
                            : isMutBorrow
                            ? "bg-danger text-cream"
                            : "bg-locked text-soot"
                        }`}
                      >
                        {isOwner
                          ? "OWNER"
                          : isImmBorrow
                          ? "& IMMUTABLE"
                          : isMutBorrow
                          ? "&mut EXCLUSIVE"
                          : "MOVED (INVALID)"}
                      </span>
                    </div>

                    <div className="mt-1 text-[10px] text-soot/80">
                      Type: <code>{v.type}</code>
                    </div>

                    {isMoved && (
                      <div className="mt-1 border-t border-ink/20 pt-1 text-[9px] font-black text-danger">
                        ⛔ VALUE HAS BEEN MOVED (Inaccessible)
                      </div>
                    )}

                    {v.borrowedFrom && (
                      <div className="mt-1 border-t border-ink/20 pt-1 text-[9px] font-bold text-unlocked">
                        ↳ Borrowed reference to `{v.borrowedFrom}`
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Compiler Rule Alert (If any) */}
      {step.ruleViolated && (
        <div className="border-t-2 border-ink bg-danger p-3 text-cream">
          <div className="flex items-start gap-2">
            <span className="shrink-0 border-2 border-cream bg-soot px-1.5 py-0.5 text-[10px] font-black uppercase text-danger">
              BORROW CHECKER RULE
            </span>
            <p className="text-xs font-bold leading-relaxed">{step.ruleViolated}</p>
          </div>
        </div>
      )}

      {/* Guide Dialogue Box */}
      <div className="border-t-2 border-ink bg-grid p-3">
        <div className="flex items-start gap-2">
          <span className="shrink-0 border-2 border-ink bg-unlocked px-1.5 py-0.5 text-[10px] font-black uppercase text-cream">
            GUIDE
          </span>
          <p className="text-xs font-medium leading-relaxed text-soot">
            {step.explanation}
          </p>
        </div>
      </div>

      {/* Playback Controls & Timeline */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-ink bg-teal p-3">
        <div className="flex items-center gap-1.5 text-xs font-black">
          <span className="text-soot">STEP</span>
          <span className="border border-ink bg-cream px-2 py-0.5">
            {currentStepIndex + 1} / {scenario.steps.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleFirst}
            disabled={isFirst}
            className="border-2 border-ink bg-cream px-2 py-1 text-xs font-bold uppercase hover:bg-grid disabled:opacity-40"
            title="Go to first step"
          >
            |◀
          </button>
          <button
            type="button"
            onClick={handlePrev}
            disabled={isFirst}
            className="border-2 border-ink bg-cream px-2.5 py-1 text-xs font-bold uppercase hover:bg-grid disabled:opacity-40"
          >
            ◀ PREV
          </button>
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`border-2 border-ink px-3 py-1 text-xs font-black uppercase ${
              isPlaying ? "bg-danger text-cream" : "bg-unlocked text-cream"
            } hover:opacity-90`}
          >
            {isPlaying ? "PAUSE ❚❚" : "AUTO PLAY ▶"}
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={isLast}
            className="border-2 border-ink bg-cream px-2.5 py-1 text-xs font-bold uppercase hover:bg-grid disabled:opacity-40"
          >
            NEXT ▶
          </button>
          <button
            type="button"
            onClick={handleLast}
            disabled={isLast}
            className="border-2 border-ink bg-cream px-2 py-1 text-xs font-bold uppercase hover:bg-grid disabled:opacity-40"
            title="Go to last step"
          >
            ▶|
          </button>
        </div>
      </div>
    </div>
  );
}
