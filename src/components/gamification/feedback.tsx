"use client";

import { hasFeedback, type GamificationFeedback } from "@/lib/progression/feedback";

export default function Feedback({
  feedback,
}: {
  feedback: GamificationFeedback | null | undefined;
}) {
  if (!hasFeedback(feedback)) return null;
  const { xp, streak, unlocked } = feedback!;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border-2 border-ink bg-complete/60 px-3 py-2">
      {xp > 0 ? (
        <span className="text-sm font-black uppercase tracking-wide text-soot">
          +{xp} XP
        </span>
      ) : null}
      {streak > 0 ? (
        <span className="text-sm font-black uppercase tracking-wide text-soot">
          🔥 {streak} day streak
        </span>
      ) : null}
      {unlocked.map((achievement) => (
        <span
          key={achievement.id}
          className="text-sm font-bold uppercase tracking-wide text-soot"
        >
          🏆 {achievement.title} unlocked!
        </span>
      ))}
    </div>
  );
}
