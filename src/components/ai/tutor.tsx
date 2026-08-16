"use client";

import { useRef, useState } from "react";
import { askTutor } from "@/lib/actions";
import type { TutorMode } from "@/lib/ai/types";

export interface TutorQuickAction {
  mode: TutorMode;
  label: string;
  prompt: string;
}

export interface TutorQuizContext {
  id: string;
  questionId?: string;
  afterSubmit: boolean;
  selectedOptionText?: string;
}

interface TutorMessage {
  role: "user" | "assistant";
  content: string;
}

const DEFAULT_QUICK_ACTIONS: TutorQuickAction[] = [
  { mode: "EXPLAIN", label: "Explain", prompt: "Explain this concept." },
  { mode: "HINT", label: "Hint", prompt: "Give me a hint." },
  { mode: "ASK", label: "Ask", prompt: "" },
];

export default function Tutor({
  skillId,
  lessonId,
  exerciseId,
  quiz,
  getDebugContext,
  quickActions = DEFAULT_QUICK_ACTIONS,
  title = "AI Tutor",
}: {
  skillId?: string;
  lessonId?: string;
  exerciseId?: string;
  quiz?: TutorQuizContext;
  getDebugContext?: () => { code?: string; output?: string; error?: string } | null;
  quickActions?: TutorQuickAction[];
  title?: string;
}) {
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const conversationIdRef = useRef<string | null>(null);

  async function send(mode: TutorMode, questionOverride?: string) {
    const question = (questionOverride ?? input).trim();
    if (!question || loading) return;

    setLoading(true);
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInput("");

    const res = await askTutor({
      mode,
      question,
      conversationId: conversationIdRef.current ?? undefined,
      skillId,
      lessonId,
      exerciseId,
      quiz: quiz && quiz.questionId
        ? { id: quiz.id, questionId: quiz.questionId, afterSubmit: quiz.afterSubmit, selectedOptionText: quiz.selectedOptionText }
        : undefined,
      debug: getDebugContext?.() ?? undefined,
    });

    if (res.result) {
      const { reply, conversationId } = res.result;
      conversationIdRef.current = conversationId;
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } else if (res.error) {
      setError(res.error);
      setMessages((prev) => prev.filter((m, i) => i < prev.length - 1));
    }
    setLoading(false);
  }

  function handleQuickAction(action: TutorQuickAction) {
    void send(action.mode, action.prompt);
  }

  return (
    <section className="flex flex-col gap-3 border-2 border-ink bg-cream p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-widest text-soot">
          {title}
        </h3>
        <span className="border-2 border-ink bg-grid px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-soot/70">
          Optional
        </span>
      </div>

      {messages.length > 0 ? (
        <div
          role="log"
          aria-live="polite"
          aria-label="Tutor conversation"
          className="flex max-h-72 flex-col gap-2 overflow-y-auto"
        >
          {messages.map((message, i) => (
            <div
              key={i}
              className={`flex flex-col gap-1 border-2 border-ink px-3 py-2 ${
                message.role === "user" ? "bg-unlocked/50" : "bg-grid"
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-soot/60">
                {message.role === "user" ? "You" : "Tutor"}
              </span>
              <p className="whitespace-pre-wrap text-sm leading-5 text-soot">
                {message.content}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs leading-5 text-soot/70">
          Stuck? Ask a question about what you are studying. The tutor guides
          you toward the answer instead of just handing it over.
        </p>
      )}

      {loading ? (
        <p
          role="status"
          aria-live="polite"
          className="border-2 border-ink bg-grid px-3 py-2 text-sm font-bold uppercase tracking-wide text-soot"
        >
          Thinking…
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="border-2 border-ink bg-danger px-3 py-2 text-sm font-bold text-soot"
        >
          {error}
        </p>
      ) : null}

      {quickActions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => handleQuickAction(action)}
              disabled={loading}
              className="border-2 border-ink bg-grid px-3 py-1 text-xs font-bold uppercase text-soot hover:bg-teal disabled:cursor-not-allowed disabled:opacity-50"
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex gap-2">
        <input
          aria-label="Ask the AI tutor"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void send("ASK");
          }}
          placeholder="Ask a question…"
          maxLength={2000}
          className="min-w-0 flex-1 border-2 border-ink bg-cream px-3 py-2 text-sm text-soot outline-none focus:bg-grid"
        />
        <button
          type="button"
          onClick={() => void send("ASK")}
          disabled={loading || input.trim().length === 0}
          className="border-2 border-ink bg-unlocked px-4 py-2 font-bold uppercase text-soot shadow-[3px_3px_0_#1e1e1e] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_#1e1e1e] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </section>
  );
}
