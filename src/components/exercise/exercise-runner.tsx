"use client";

import { useState } from "react";
import CodeEditor from "./code-editor";
import { runExercise, submitExercise } from "@/lib/actions";
import type { GamificationFeedback } from "@/lib/progression";
import Feedback from "@/components/gamification/feedback";
import Tutor from "@/components/ai/tutor";
import type { TutorQuickAction } from "@/components/ai/tutor";

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
  hints,
  executionMode,
}: {
  exerciseId: string;
  skillId: string;
  language: string;
  starterCode: string;
  hints: string[];
  executionMode: { provider: string; executesCode: boolean };
}) {
  const [code, setCode] = useState(starterCode);
  const [hintsShown, setHintsShown] = useState(0);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RunnerResult | null>(null);

  async function handleRun() {
    setRunning(true);
    setError(null);
    setResult(null);
    setOutput(null);
    const res = await runExercise(exerciseId, code);
    if (isError(res)) {
      setError(res.error);
    } else if (res.result) {
      const r = res.result;
      if (r.status === "unavailable" || r.error) {
        setError(r.error ?? "Runner unavailable");
        setOutput(r.stdout || r.stderr || "");
      } else {
        setOutput(r.stdout || r.stderr || "(no output)");
      }
    }
    setRunning(false);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    setResult(null);
    setOutput(null);
    const res = await submitExercise(exerciseId, code);
    if (isError(res)) {
      setError(res.error);
    } else if (res.result) {
      setResult(res.result);
    }
    setSubmitting(false);
  }

  function handleReset() {
    setCode(starterCode);
    setOutput(null);
    setResult(null);
    setError(null);
    setHintsShown(0);
  }

  const hintButtonDisabled = hintsShown >= hints.length;
  const runningOrSubmitting = running || submitting;

  return (
    <div className="flex flex-col gap-4">
      {!executionMode.executesCode ? (
        <p className="border-2 border-ink bg-grid px-3 py-2 text-xs font-bold uppercase tracking-wide text-soot">
          Runner: {executionMode.provider} — code is not executed in this
          environment. Results come back as “unavailable” until a safe sandbox
          is wired.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm font-bold uppercase text-soot">
          Language
          <select
            value={language}
            disabled
            className="border-2 border-ink bg-cream px-2 py-1 text-sm font-bold uppercase text-soot disabled:opacity-60"
          >
            <option value={language}>{language}</option>
          </select>
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleRun}
            aria-busy={running}
            disabled={runningOrSubmitting}
            className="min-h-12 border-2 border-ink bg-cream px-4 py-2 font-bold uppercase text-soot shadow-[3px_3px_0_#1e1e1e] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_#1e1e1e] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {running ? "Running..." : "Run"}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            aria-busy={submitting}
            disabled={runningOrSubmitting}
            className="min-h-12 border-2 border-ink bg-complete px-4 py-2 font-bold uppercase text-soot shadow-[3px_3px_0_#1e1e1e] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_#1e1e1e] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Grading..." : "Submit"}
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={runningOrSubmitting}
            className="min-h-12 border-2 border-ink bg-grid px-4 py-2 font-bold uppercase text-soot disabled:opacity-50"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <CodeEditor value={code} onChange={setCode} language={language} />

        {error ? (
          <div
            role="alert"
            className="flex flex-col gap-1 border-2 border-ink bg-danger px-3 py-2"
          >
            <span className="text-xs font-bold uppercase tracking-widest text-soot/70">
              Runner notice
            </span>
            <p className="text-sm font-bold text-soot">{error}</p>
          </div>
        ) : null}

        {output !== null ? (
          <div
            role="status"
            aria-live="polite"
            className="flex flex-col gap-1 border-2 border-ink bg-cream px-3 py-2"
          >
            <span className="text-xs font-bold uppercase tracking-widest text-soot/70">
              Output
            </span>
            <pre className="whitespace-pre-wrap break-words text-sm text-soot">
              {output}
            </pre>
          </div>
        ) : null}

        {result ? (
          <div
            role="status"
            aria-live="polite"
            className="flex flex-col gap-3 border-2 border-ink bg-cream p-4"
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-lg font-black uppercase text-soot">
                {result.passed ? "Passed!" : "Not yet"}
              </span>
              <span className="text-sm font-bold text-soot">
                {result.testsPassed}/{result.testsTotal} tests passing
              </span>
              {result.executionTimeMs !== undefined ? (
                <span className="text-xs text-soot/70">
                  {result.executionTimeMs} ms
                </span>
              ) : null}
            </div>

            {result.status === "unavailable" ? (
              <p className="border-2 border-ink bg-grid px-3 py-2 text-sm font-bold text-soot">
                Your submission was recorded, but it could not be executed in
                this environment.
              </p>
            ) : null}
            {result.error ? (
              <pre className="whitespace-pre-wrap break-words border-2 border-ink bg-grid px-3 py-2 text-sm text-soot">
                {result.error}
              </pre>
            ) : null}
            {result.stdout ? (
              <pre className="whitespace-pre-wrap break-words text-sm text-soot">
                {result.stdout}
              </pre>
            ) : null}
            {result.stderr ? (
              <pre className="whitespace-pre-wrap break-words text-sm text-danger">
                {result.stderr}
              </pre>
            ) : null}

            {result.results.length > 0 ? (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-soot/70">
                  Visible test results
                </span>
                {result.results.map((test) => (
                  <div
                    key={test.order}
                    className={`flex flex-col gap-1 border-2 border-ink px-3 py-2 text-sm ${
                      test.passed ? "bg-complete/40" : "bg-danger/40"
                    }`}
                  >
                    <span className="flex items-center gap-2 font-bold text-soot">
                      <span
                        className={`flex h-4 w-4 items-center justify-center border border-ink text-[10px] ${
                          test.passed ? "bg-unlocked" : "bg-danger"
                        }`}
                      >
                        {test.passed ? "✓" : "✗"}
                      </span>
                      {test.name}
                    </span>
                    {test.error ? (
                      <pre className="whitespace-pre-wrap break-words text-xs text-soot">
                        {test.error}
                      </pre>
                    ) : (
                      <pre className="whitespace-pre-wrap break-words text-xs text-soot/80">
                        input: {test.input || "(none)"}
                        {"\n"}expected: {test.expectedOutput}
                        {"\n"}actual: {test.actualOutput ?? "(none)"}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            ) : null}

            <p className="text-xs text-soot/70">
              This attempt was saved to your progress history.
            </p>
            {result.passed ? <Feedback feedback={result} /> : null}
          </div>
        ) : null}
      </div>

      {hints.length > 0 ? (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-soot/70">
            Hints
          </span>
          {hints.slice(0, hintsShown).map((hint, index) => (
            <p key={index} className="border-l-2 border-ink bg-grid px-3 py-2 text-sm text-soot">
              <span className="font-black">Hint {index + 1}:</span> {hint}
            </p>
          ))}
          {!hintButtonDisabled ? (
            <button
              type="button"
              onClick={() => setHintsShown((n) => n + 1)}
              className="w-fit border-2 border-ink bg-cream px-3 py-1 text-xs font-bold uppercase text-soot hover:bg-grid"
            >
              {hintsShown === 0 ? "Show a hint" : "Show next hint"}
            </button>
          ) : null}
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
        <a href={`/skill/${skillId}`} className="underline">
          {skillId} skill
        </a>{" "}
        marks your place in the learning path.
      </p>
    </div>
  );
}

function isError(
  res: { error?: string; result?: unknown },
): res is RunnerError {
  return typeof res.error === "string";
}
