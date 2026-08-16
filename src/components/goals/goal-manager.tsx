"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useActionState } from "react";
import { addGoal, removeGoal, updateGoalText } from "@/lib/actions";
import type { CourseGoalOption, GoalView } from "@/lib/goals";

interface GoalManagerProps {
  goals: GoalView[];
  options: CourseGoalOption[];
}

export default function GoalManager({ goals, options }: GoalManagerProps) {
  const router = useRouter();
  const [courseId, setCourseId] = useState("");
  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAdd = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAdding(true);
    setAddError("");
    const formData = new FormData(event.currentTarget);
    const result = await addGoal({}, formData);
    setAdding(false);
    if (result.error) {
      setAddError(result.error);
    } else {
      setCourseId("");
      router.refresh();
    }
  };

  const takenIds = new Set(goals.flatMap((goal) => (goal.courseId ? [goal.courseId] : [])));
  const available = options.filter((option) => !takenIds.has(option.id));
  const atLimit = goals.length >= 3;

  return (
    <section className="flex flex-col gap-4 border-2 border-ink bg-cream p-5">
      <div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
          Course goals
        </h2>
        <p className="mt-1 text-sm text-soot/70">
          Pin up to 3 courses. Goals drive your recommendations and learning
          path.
        </p>
      </div>

      {goals.length === 0 ? (
        <p className="border-2 border-ink bg-grid px-3 py-2 text-sm text-soot/70">
          No goals yet — pick a course below to set one.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {goals.map((goal) => (
            <li key={goal.id}>
              <GoalRow goal={goal} />
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="flex flex-col gap-3">
        {addError ? (
          <p className="border-2 border-ink bg-danger px-3 py-2 text-sm font-bold text-soot">
            {addError}
          </p>
        ) : null}
        {atLimit ? (
          <p className="border-2 border-ink bg-grid px-3 py-2 text-sm text-soot/70">
            You have 3 active goals. Remove one to add another.
          </p>
        ) : available.length === 0 ? (
          <p className="border-2 border-ink bg-grid px-3 py-2 text-sm text-soot/70">
            Every course is already a goal.
          </p>
        ) : (
          <>
            <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-widest text-soot">
              Course
              <select
                name="courseId"
                value={courseId}
                onChange={(event) => setCourseId(event.target.value)}
                required
                className="border-2 border-ink bg-grid px-2 py-1 text-sm font-bold normal-case text-soot outline-none focus:bg-cream"
              >
                <option value="" disabled>
                  Choose a course…
                </option>
                {available.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.title} · {option.difficulty}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-widest text-soot">
              Label (optional)
              <input
                name="note"
                type="text"
                maxLength={80}
                placeholder="e.g. Master C this month"
                className="border-2 border-ink bg-grid px-2 py-1 text-sm font-normal normal-case text-soot outline-none focus:bg-cream"
              />
            </label>
            <button
              type="submit"
              disabled={adding}
              className="border-2 border-ink bg-complete px-4 py-2 text-sm font-bold uppercase text-soot shadow-[3px_3px_0_#1e1e1e] transition-transform enabled:hover:translate-x-0.5 enabled:hover:translate-y-0.5 enabled:hover:shadow-[1px_1px_0_#1e1e1e] disabled:opacity-60"
            >
              {adding ? "Saving..." : "Set goal"}
            </button>
          </>
        )}
      </form>
    </section>
  );
}

function GoalRow({ goal }: { goal: GoalView }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateGoalText, {});

  useEffect(() => {
    if (state.result) router.refresh();
  }, [state.result, router]);

  return (
    <div className="flex flex-col gap-2 border-2 border-ink bg-grid px-3 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-bold text-soot">{goal.goal}</span>
        <span className="text-xs uppercase text-soot/60">
          {goal.courseCategory ?? ""}
        </span>
      </div>

      <form action={formAction} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="goalId" value={goal.id} />
        <input
          name="text"
          type="text"
          defaultValue={goal.goal}
          maxLength={80}
          className="min-w-0 flex-1 border-2 border-ink bg-cream px-2 py-1 text-sm text-soot outline-none focus:bg-teal"
        />
        <button
          type="submit"
          disabled={pending}
          className="border-2 border-ink bg-teal px-3 py-1 text-xs font-bold uppercase text-soot disabled:opacity-60"
        >
          Rename
        </button>
      </form>

      {state.error ? (
        <p className="text-xs font-bold text-danger">{state.error}</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {goal.courseSlug ? (
          <Link
            href={`/course/${goal.courseSlug}`}
            className="text-xs font-bold uppercase text-soot underline hover:text-soot/60"
          >
            View course
          </Link>
        ) : null}
        <button
          type="button"
          onClick={async () => {
            const result = await removeGoal(goal.id);
            if (!result.error) router.refresh();
          }}
          className="ml-auto border-2 border-ink bg-danger px-3 py-1 text-xs font-bold uppercase text-soot hover:opacity-90"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
