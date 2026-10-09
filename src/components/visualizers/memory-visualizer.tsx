"use client";

import { useState, useEffect, useRef } from "react";
import type { MemoryScenario } from "@/lib/visualizers/types";
import { retroAudio } from "@/lib/audio/retro-audio";

export default function MemoryVisualizer({
  scenario,
  compact = false,
}: {
  scenario: MemoryScenario;
  compact?: boolean;
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
      }, reduceMotion ? 1800 : 2400);
    }
    return () => {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
    };
  }, [isPlaying, currentStepIndex, isLast, reduceMotion]);

  const handleNext = () => {
    if (!isLast) {
      setCurrentStepIndex((prev) => prev + 1);
      retroAudio.playStep();
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
            {scenario.language.toUpperCase()}
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
            title="Toggle reduced motion transitions"
          >
            Motion: {reduceMotion ? "Reduced" : "Normal"}
          </button>
          <button
            type="button"
            onClick={toggleSound}
            className="border-2 border-ink bg-cream px-2 py-0.5 text-[10px] font-bold uppercase hover:bg-grid"
            title="Toggle 8-bit sound effects"
          >
            Sound: {isMuted ? "Muted 🔇" : "On 🔊"}
          </button>
        </div>
      </div>

      {/* Main interactive stage */}
      <div className="grid grid-cols-1 gap-3 p-3 lg:grid-cols-12">
        {/* Left: Code viewer with active line highlight */}
        <div className="flex flex-col border-2 border-ink bg-grid p-2.5 lg:col-span-5">
          <div className="mb-2 flex items-center justify-between border-b-2 border-ink pb-1">
            <span className="text-[11px] font-black uppercase tracking-widest text-soot">
              Source Code
            </span>
            <span className="text-[10px] font-bold uppercase text-soot/70">
              Line {step.codeLine}
            </span>
          </div>

          <div className="flex flex-col gap-0.5 text-xs">
            {scenario.code.map((line, idx) => {
              const lineNum = idx + 1;
              const isActive = lineNum === step.codeLine;
              return (
                <div
                  key={lineNum}
                  className={`flex items-center gap-2 px-1.5 py-0.5 transition-colors ${
                    isActive
                      ? "border border-ink bg-unlocked font-bold text-cream"
                      : "text-soot/80"
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

          {/* Action Badge */}
          <div className="mt-3 flex items-center justify-between border-t-2 border-ink pt-2">
            <span className="text-[10px] font-bold uppercase text-soot/70">
              Active Action
            </span>
            <span
              className={`border-2 border-ink px-1.5 py-0.5 text-[10px] font-black uppercase ${
                step.activeAction === "FREE_HEAP" || step.activeAction === "POP_FRAME"
                  ? "bg-danger text-cream"
                  : step.activeAction === "ALLOC_HEAP" || step.activeAction === "ALLOC_STACK"
                  ? "bg-complete text-soot"
                  : "bg-teal text-soot"
              }`}
            >
              {step.activeAction}
            </span>
          </div>
        </div>

        {/* Right: Dual Memory Layout (Stack Frame & Heap Memory) */}
        <div className="grid grid-cols-1 gap-3 lg:col-span-7 sm:grid-cols-2">
          {/* Stack Region */}
          <div className="flex flex-col border-2 border-ink bg-cream p-2.5">
            <div className="mb-2 flex items-center justify-between border-b-2 border-ink pb-1">
              <span className="text-[11px] font-black uppercase tracking-widest text-soot">
                Call Stack 📦
              </span>
              <span className="text-[10px] font-bold uppercase text-unlocked">
                LIFO (Auto)
              </span>
            </div>

            <div className="flex min-h-[160px] flex-col gap-2">
              {step.stack.length === 0 ? (
                <div className="flex flex-1 items-center justify-center border-2 border-dashed border-ink/40 p-4 text-center text-xs italic text-soot/60">
                  (Stack is empty / frame popped)
                </div>
              ) : (
                step.stack.map((frame, fIdx) => (
                  <div key={fIdx} className="border-2 border-ink bg-grid p-2">
                    <div className="mb-1 flex items-center justify-between text-[10px] font-black uppercase text-soot">
                      <span>FRAME: {frame.functionName}</span>
                    </div>

                    {frame.variables.length === 0 ? (
                      <div className="text-[10px] italic text-soot/60">
                        (No local variables yet)
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {frame.variables.map((v, vIdx) => (
                          <div
                            key={vIdx}
                            className={`flex flex-col border border-ink p-1.5 text-[11px] ${
                              v.isHighlighted ? "bg-teal font-bold" : "bg-cream"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold">{v.name}</span>
                              <span className="text-[9px] opacity-75">{v.type}</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-soot/80">
                              <span>Val: {v.value}</span>
                              <span className="opacity-60">{v.address}</span>
                            </div>
                            {v.pointsTo && (
                              <div className="mt-0.5 border-t border-ink/20 pt-0.5 text-[9px] font-bold text-unlocked">
                                ➔ Points to Heap: {v.pointsTo}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Heap Region */}
          <div className="flex flex-col border-2 border-ink bg-cream p-2.5">
            <div className="mb-2 flex items-center justify-between border-b-2 border-ink pb-1">
              <span className="text-[11px] font-black uppercase tracking-widest text-soot">
                Heap Memory 🏗️
              </span>
              <span className="text-[10px] font-bold uppercase text-complete">
                Dynamic
              </span>
            </div>

            <div className="flex min-h-[160px] flex-col gap-2">
              {step.heap.length === 0 ? (
                <div className="flex flex-1 items-center justify-center border-2 border-dashed border-ink/40 p-4 text-center text-xs italic text-soot/60">
                  (Heap is unallocated)
                </div>
              ) : (
                step.heap.map((h) => (
                  <div
                    key={h.id}
                    className={`flex flex-col border-2 border-ink p-2 text-xs transition-all ${
                      h.isFreed
                        ? "border-dashed border-ink/60 bg-danger/20 opacity-70"
                        : h.isHighlighted
                        ? "bg-complete/30 font-bold"
                        : "bg-grid"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-black">
                      <span>ADDR: {h.address}</span>
                      <span
                        className={`px-1 py-0.2 text-[9px] uppercase ${
                          h.isFreed ? "bg-danger text-cream" : "bg-complete text-soot"
                        }`}
                      >
                        {h.isFreed ? "FREED" : `${h.sizeBytes} B`}
                      </span>
                    </div>

                    <div className="mt-1 font-mono text-[11px] font-bold text-soot">
                      {h.value}
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[9px] text-soot/70">
                      <span>Allocated by: {h.allocatedBy}</span>
                      <span>{h.label}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Explanation Box in Game Dialogue Style */}
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
        {/* Step index counter */}
        <div className="flex items-center gap-1.5 text-xs font-black">
          <span className="text-soot">STEP</span>
          <span className="border border-ink bg-cream px-2 py-0.5">
            {currentStepIndex + 1} / {scenario.steps.length}
          </span>
        </div>

        {/* Buttons */}
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
