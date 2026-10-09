"use client";

import { useState } from "react";
import CodeEditor from "./code-editor";
import { runExercise, submitExercise, unlockExerciseHint } from "@/lib/actions";
import type { GamificationFeedback } from "@/lib/progression";
import Feedback from "@/components/gamification/feedback";
import Tutor from "@/components/ai/tutor";
import type { TutorQuickAction } from "@/components/ai/tutor";
import { retroAudio } from "@/lib/audio/retro-audio";

const EXERCISE_TUTOR_ACTIONS: TutorQuickAction[] = [
  { mode: "EXPLAIN", label: "Explain", prompt: "Explain this problem and the concept it practices." },
  { mode: "HINT", label: "Hint", prompt: "Give me a hint." },
  { mode: "DEBUG", label: "Debug", prompt: "Why doesn't my code work?" },
  { mode: "EXPLAIN_ANSWER", label: "Why?", prompt: "Why is my answer wrong?" },
];

interface RunnerTestResult {
  order: number;
  name: string;
  passed: boolean;
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  error?: string;
  isPublic?: boolean;
}

interface RunnerResult extends GamificationFeedback {
  status: "ok" | "error" | "timeout" | "unavailable";
  passed: boolean;
  testsPassed: number;
  testsTotal: number;
  stdout: string;
  stderr: string;
  executionTimeMs?: number;
  error?: string;
  attemptId: string;
  cached?: boolean;
  results: RunnerTestResult[];
}

interface RunnerError {
  error: string;
}

export default function ExerciseRunner({
  exerciseId,
  skillId,
  language,
  starterCode,
  hints: initialUnlockedHints,
  totalHintsCount = 0,
  executionMode,
}: {
  exerciseId: string;
  skillId: string;
  language: string;
  starterCode: string;
  hints: string[];
  totalHintsCount?: number;
  executionMode: { provider: string; executesCode: boolean };
}) {
  const [code, setCode] = useState(starterCode);
  const [unlockedHints, setUnlockedHints] = useState<string[]>(initialUnlockedHints);
  const [unlockingHint, setUnlockingHint] = useState(false);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RunnerResult | null>(null);
  const [muted, setMuted] = useState(retroAudio.isMuted());

  function toggleMute() {
    const next = !muted;
    retroAudio.setMuted(next);
    setMuted(next);
  }

  async function handleRun() {
    setRunning(true);
    setError(null);
    setResult(null);
    setOutput(null);
    retroAudio.playSelect();

    const res = await runExercise(exerciseId, code);
    if (isError(res)) {
      setError(res.error);
      retroAudio.playError();
    } else if (res.result) {
      const r = res.result;
      if (r.status === "unavailable" || r.error) {
        setError(r.error ?? "Runner unavailable");
        setOutput(r.stdout || r.stderr || "");
        retroAudio.playError();
      } else {
        setOutput(r.stdout || r.stderr || "(no stdout emitted)");
        retroAudio.playMove();
      }
    }
    setRunning(false);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    setResult(null);
    setOutput(null);
    retroAudio.playSelect();

    const res = await submitExercise(exerciseId, code);
    if (isError(res)) {
      setError(res.error);
      retroAudio.playError();
    } else if (res.result) {
      setResult(res.result);
      if (res.result.passed) {
        retroAudio.playSuccess();
      } else {
        retroAudio.playError();
      }
    }
    setSubmitting(false);
  }

  async function handleUnlockNextHint() {
    setUnlockingHint(true);
    retroAudio.playSelect();
    const res = await unlockExerciseHint(exerciseId);
    if (res.result) {
      setUnlockedHints(res.result.unlockedHints);
      retroAudio.playMove();
    }
    setUnlockingHint(false);
  }

  function handleReset() {
    setCode(starterCode);
    setOutput(null);
    setResult(null);
    setError(null);
    retroAudio.playSelect();
  }

  const hintsMax = Math.max(totalHintsCount, unlockedHints.length);
  const canUnlockMoreHints = unlockedHints.length < hintsMax;
  const runningOrSubmitting = running || submitting;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-2 border-ink bg-cream p-3">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-black uppercase text-soot">
            Language:
            <span className="border-2 border-ink bg-grid px-2 py-0.5 text-xs font-bold text-soot">
              {language}
            </span>
          </label>
          <span className="text-xs text-soot/60">·</span>
          <span className="text-xs font-bold uppercase text-soot/80">
            Runner: <span className="font-mono text-soot">{executionMode.provider}</span>
          </span>
        </div>

        <button
          type="button"
          onClick={toggleMute}
          className="border-2 border-ink bg-grid px-2.5 py-1 text-xs font-bold uppercase text-soot hover:bg-teal"
          title={muted ? "Unmute Retro Sound FX" : "Mute Sound FX"}
        >
          {muted ? "🔇 Sound Off" : "🔊 Sound On"}
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <CodeEditor value={code} onChange={setCode} language={language} />

        <div className="flex flex-wrap items-center justify-between gap-2 border-2 border-ink bg-cream p-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleRun}
              aria-busy={running}
              disabled={runningOrSubmitting}
              className="min-h-10 border-2 border-ink bg-grid px-4 py-1.5 text-xs font-black uppercase text-soot shadow-[2px_2px_0_#1e1e1e] hover:translate-x-0.5 hover:translate-y-0.5 hover:bg-teal hover:shadow-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {running ? "⚡ Executing..." : "▶ Dry Run"}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              aria-busy={submitting}
              disabled={runningOrSubmitting}
              className="min-h-10 border-2 border-ink bg-complete px-5 py-1.5 text-xs font-black uppercase text-soot shadow-[2px_2px_0_#1e1e1e] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "⚔ Evaluating..." : "⚔ Battle Submit"}
            </button>
          </div>

          <button
            type="button"
            onClick={handleReset}
            disabled={runningOrSubmitting}
            className="border-2 border-ink bg-cream px-3 py-1 text-xs font-bold uppercase text-soot hover:bg-grid disabled:opacity-50"
          >
            ↺ Reset Starter
          </button>
        </div>

        {error ? (
          <div
            role="alert"
            className="flex flex-col gap-1 border-2 border-ink bg-danger p-3"
          >
            <span className="text-xs font-black uppercase tracking-widest text-soot">
              ⚠ Forge Execution Notice
            </span>
            <p className="text-xs font-bold leading-relaxed text-soot">{error}</p>
          </div>
        ) : null}

        {output !== null ? (
          <div
            role="status"
            aria-live="polite"
            className="flex flex-col gap-1 border-2 border-ink bg-cream p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-widest text-soot">
                Console Output
              </span>
              <span className="text-[10px] font-bold uppercase text-soot/60">
                stdout / stderr
              </span>
            </div>
            <pre className="mt-1 overflow-x-auto border border-ink bg-soot p-2.5 font-mono text-xs text-cream">
              {output}
            </pre>
          </div>
        ) : null}

        {result ? (
          <div
            role="status"
            aria-live="polite"
            className="flex flex-col gap-4 border-2 border-ink bg-cream p-4"
          >
            <div
              className={`flex flex-wrap items-center justify-between gap-3 border-2 border-ink p-3 ${
                result.passed ? "bg-complete text-soot" : "bg-danger text-soot"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-xl font-black">
                  {result.passed ? "★" : "⚔"}
                </span>
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight">
                    {result.passed ? "Battle Trial Cleared!" : "Trial Incomplete"}
                  </h3>
                  <p className="text-xs font-bold">
                    {result.testsPassed} / {result.testsTotal} test suites passed
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {result.cached ? (
                  <span className="border border-ink bg-cream px-2 py-0.5 text-[10px] font-black uppercase">
                    ⚡ Cached
                  </span>
                ) : null}
                {result.executionTimeMs !== undefined ? (
                  <span className="border border-ink bg-cream px-2 py-0.5 text-[10px] font-black uppercase">
                    ⏱ {result.executionTimeMs} ms
                  </span>
                ) : null}
              </div>
            </div>

            {result.error ? (
              <div className="border-2 border-ink bg-danger/30 p-3">
                <span className="text-xs font-bold uppercase tracking-wider text-soot">
                  Diagnostic Error:
                </span>
                <p className="mt-1 font-mono text-xs font-bold text-soot">{result.error}</p>
              </div>
            ) : null}

            {result.stderr ? (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-black uppercase tracking-widest text-soot">
                  Compiler Diagnostics
                </span>
                <pre className="max-h-52 overflow-auto border-2 border-ink bg-soot p-3 font-mono text-xs text-[#ff8080]">
                  {result.stderr}
                </pre>
              </div>
            ) : null}

            {result.results.length > 0 ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-widest text-soot">
                    Test Suites Breakdown
                  </span>
                  <span className="text-[10px] uppercase text-soot/70">
                    Server Verified
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  {result.results.map((test) => (
                    <div
                      key={test.order}
                      className={`flex flex-col gap-1 border-2 border-ink p-3 ${
                        test.passed ? "bg-[#d8f3dc]" : "bg-[#ffe5d9]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-xs font-black uppercase text-soot">
                          <span
                            className={`flex h-4 w-4 items-center justify-center border border-ink text-[10px] font-black ${
                              test.passed
                                ? "bg-complete text-soot"
                                : "bg-danger text-soot"
                            }`}
                          >
                            {test.passed ? "✓" : "✗"}
                          </span>
                          {test.name}
                        </span>

                        <span
                          className={`text-[10px] font-black uppercase px-1.5 py-0.5 border border-ink ${
                            test.passed ? "bg-complete" : "bg-danger"
                          }`}
                        >
                          {test.passed ? "PASS" : "FAIL"}
                        </span>
                      </div>

                      {test.isPublic !== false ? (
                        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs font-mono">
                          <div className="border border-ink bg-cream p-2">
                            <span className="text-[10px] font-black uppercase text-soot/60 block">
                              Input
                            </span>
                            <span className="text-soot">{test.input || "(none)"}</span>
                          </div>
                          <div className="border border-ink bg-cream p-2">
                            <span className="text-[10px] font-black uppercase text-soot/60 block">
                              Expected
                            </span>
                            <span className="text-soot">{test.expectedOutput}</span>
                          </div>
                          {test.actualOutput ? (
                            <div className="col-span-full border border-ink bg-cream p-2">
                              <span className="text-[10px] font-black uppercase text-soot/60 block">
                                Actual Output
                              </span>
                              <span
                                className={
                                  test.passed ? "text-soot" : "text-danger font-bold"
                                }
                              >
                                {test.actualOutput}
                              </span>
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <div className="mt-1 border border-ink bg-cream p-2 text-xs">
                          <span className="font-mono text-soot/80">
                            🔒 Server Assertion:{" "}
                            {test.passed ? "Verified Pass" : "Assertion Mismatch"}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {result.passed ? <Feedback feedback={result} /> : null}
          </div>
        ) : null}
      </div>

      {/* Graduated Hints Section */}
      {hintsMax > 0 ? (
        <div className="flex flex-col gap-2 border-2 border-ink bg-cream p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest text-soot">
              Graduated Hints ({unlockedHints.length} / {hintsMax})
            </span>
            {canUnlockMoreHints ? (
              <button
                type="button"
                onClick={handleUnlockNextHint}
                disabled={unlockingHint || runningOrSubmitting}
                className="border-2 border-ink bg-teal px-3 py-1 text-xs font-bold uppercase text-soot shadow-[2px_2px_0_#1e1e1e] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none disabled:opacity-50"
              >
                {unlockingHint ? "Unlocking..." : "💡 Unlock Next Hint"}
              </button>
            ) : (
              <span className="text-[10px] font-bold uppercase text-soot/60">
                All hints unlocked
              </span>
            )}
          </div>

          {unlockedHints.length > 0 ? (
            <div className="mt-2 flex flex-col gap-2">
              {unlockedHints.map((hint, idx) => (
                <div
                  key={idx}
                  className="border-l-4 border-ink bg-grid p-3 text-xs leading-relaxed text-soot"
                >
                  <span className="font-black uppercase text-soot">
                    Hint {idx + 1}:
                  </span>{" "}
                  {hint}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-1 text-xs text-soot/70">
              Need a nudge? Unlock progressive hints step-by-step as you work on the challenge.
            </p>
          )}
        </div>
      ) : null}

      <Tutor
        exerciseId={exerciseId}
        skillId={skillId}
        quickActions={EXERCISE_TUTOR_ACTIONS}
        getDebugContext={() => ({
          code,
          output: output ?? undefined,
          error: error ?? undefined,
        })}
      />

      <p className="text-xs text-soot/60">
        Returning to the{" "}
        <a href={`/skill/${skillId}`} className="underline font-bold">
          {skillId} skill route
        </a>{" "}
        updates your battle progression.
      </p>
    </div>
  );
}

function isError(
  res: { error?: string; result?: unknown },
): res is RunnerError {
  return typeof res.error === "string";
}
