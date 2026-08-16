"use client";

import { useState } from "react";
import { submitQuiz } from "@/lib/actions";
import type { GamificationFeedback } from "@/lib/progression";
import Feedback from "@/components/gamification/feedback";
import Tutor from "@/components/ai/tutor";
import type { TutorQuickAction } from "@/components/ai/tutor";

const QUIZ_TUTOR_ACTIONS: TutorQuickAction[] = [
  { mode: "EXPLAIN", label: "Explain this question", prompt: "Explain the concept behind this question." },
  { mode: "HINT", label: "Hint", prompt: "Give me a hint about this question." },
  { mode: "EXPLAIN_ANSWER", label: "Why?", prompt: "Why is my answer wrong?" },
];

interface RunnerOption {
  id: string;
  text: string;
  order: number;
}

interface RunnerQuestion {
  id: string;
  prompt: string;
  order: number;
  options: RunnerOption[];
}

interface RunnerResult extends GamificationFeedback {
  score: number;
  passed: boolean;
  attemptId: string;
}

export default function QuizRunner({
  quizId,
  skillId,
  passScore,
  questions,
  lastAttempt,
}: {
  quizId: string;
  skillId: string;
  passScore: number;
  questions: RunnerQuestion[];
  lastAttempt: { score: number; passed: boolean; takenAt: Date } | null;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<RunnerResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const question = questions[index];
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;

  const selectedOptionId = question ? answers[question.id] : undefined;
  const selectedOptionText = question
    ? question.options.find((option) => option.id === selectedOptionId)?.text
    : undefined;

  const quizContext = {
    id: quizId,
    questionId: question?.id,
    afterSubmit: result !== null,
    selectedOptionText,
  };

  function selectOption(optionId: string) {
    setAnswers((prev) => ({ ...prev, [question.id]: optionId }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    const res = await submitQuiz(quizId, skillId, answers);
    if (res.result) {
      setResult(res.result);
    } else if (res.error) {
      setError(res.error);
    }
    setSubmitting(false);
  }

  if (result) {
    return (
      <div
        className="flex flex-col items-start gap-4 border-2 border-ink bg-cream p-6"
        role="status"
        aria-live="polite"
      >
        <h2 className="text-2xl font-black uppercase text-soot">
          {result.passed ? "Passed!" : "Not this time"}
        </h2>
        <p className="text-sm text-soot/80">
          You scored{" "}
          <span className="font-black text-soot">{result.score}%</span>. The pass
          mark is {passScore}%.
        </p>
        {result.passed ? (
          <p className="text-sm text-soot/80">
            This attempt has been saved to your progress history. Ready to earn
            the skill? Mark it complete from the skill page.
          </p>
        ) : (
          <p className="text-sm text-soot/80">
            Review the lessons and try again — you need {passScore}% to pass.
          </p>
        )}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              setResult(null);
              setIndex(0);
              setAnswers({});
            }}
            className="border-2 border-ink bg-complete px-4 py-2 font-bold uppercase text-soot shadow-[3px_3px_0_#1e1e1e] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_#1e1e1e]"
          >
            Try again
          </button>
        </div>
        {result.passed ? <Feedback feedback={result} /> : null}
        <Tutor
          skillId={skillId}
          quiz={quizContext}
          quickActions={QUIZ_TUTOR_ACTIONS}
          title="Ask about your answers"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {lastAttempt ? (
        <p className="border-2 border-ink bg-grid px-3 py-2 text-sm text-soot/80">
          Last attempt:{" "}
          <span className="font-black text-soot">{lastAttempt.score}%</span>{" "}
          <span className={lastAttempt.passed ? "text-soot" : "text-danger"}>
            ({lastAttempt.passed ? "passed" : "failed"})
          </span>
        </p>
      ) : null}

      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-soot/70">
          Question {index + 1} of {questions.length}
        </span>
        <span className="text-xs font-bold uppercase tracking-widest text-soot/70">
          {answeredCount} answered
        </span>
      </div>

      <div
        role="progressbar"
        aria-label="Quiz progress"
        aria-valuenow={Math.round((answeredCount / questions.length) * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 w-full border border-ink bg-grid"
      >
        <div
          className="h-full bg-unlocked"
          style={{ width: `${(answeredCount / questions.length) * 100}%` }}
        />
      </div>

      {question ? (
        <div key={question.id} className="flex flex-col gap-4">
          <h2 className="text-lg font-black text-soot">{question.prompt}</h2>
          <div className="flex flex-col gap-2">
            {question.options.map((option) => {
              const selected = answers[question.id] === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => selectOption(option.id)}
                  className={`flex min-h-12 items-center gap-3 border-2 border-ink px-3 py-2 text-left text-sm font-bold text-soot transition-colors ${
                    selected ? "bg-unlocked" : "bg-cream hover:bg-grid"
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center border-2 border-ink text-xs ${
                      selected ? "bg-soot text-cream" : "bg-cream"
                    }`}
                  >
                    {selected ? "✓" : ""}
                  </span>
                  {option.text}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="border-2 border-ink bg-danger px-3 py-2 text-sm font-bold text-soot">
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => setIndex((i) => i - 1)}
          className="border-2 border-ink bg-cream px-4 py-2 font-bold uppercase text-soot disabled:opacity-40"
        >
          Back
        </button>

        {index < questions.length - 1 ? (
          <button
            type="button"
            onClick={() => setIndex((i) => i + 1)}
            className="border-2 border-ink bg-grid px-4 py-2 font-bold uppercase text-soot"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            aria-busy={submitting}
            disabled={submitting || !allAnswered}
            className="min-h-12 border-2 border-ink bg-complete px-4 py-2 font-bold uppercase text-soot shadow-[3px_3px_0_#1e1e1e] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_#1e1e1e] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Grading..." : "Submit quiz"}
          </button>
        )}
      </div>

      {!allAnswered ? (
        <p className="text-xs text-soot/60">
          Answer every question to submit the quiz.
        </p>
      ) : null}

      <Tutor
        skillId={skillId}
        quiz={quizContext}
        quickActions={QUIZ_TUTOR_ACTIONS}
        title="Ask the AI Tutor"
      />
    </div>
  );
}
