import type { AchievementView } from "@/lib/progression";

/** Compact achievement chips for dashboards and profile pages. */
export function AchievementChips({ achievements }: { achievements: AchievementView[] }) {
  const unlocked = achievements.filter((achievement) => achievement.unlocked);
  if (unlocked.length === 0) {
    return <p className="text-sm text-soot/70">None yet. Keep learning!</p>;
  }
  return (
    <ul className="flex flex-wrap gap-2">
      {unlocked.map((achievement) => (
        <li
          key={achievement.id}
          title={achievement.description}
          className="flex items-center gap-1 border-2 border-ink bg-complete px-2 py-1 text-xs font-bold text-soot"
        >
          <span aria-hidden>{achievement.icon}</span>
          <span className="uppercase tracking-wide">{achievement.title}</span>
        </li>
      ))}
    </ul>
  );
}

/** Full grid of every catalog achievement with locked/unlocked state. */
export function AchievementGrid({ achievements }: { achievements: AchievementView[] }) {
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {achievements.map((achievement) => (
        <li
          key={achievement.id}
          className={`flex items-start gap-3 border-2 border-ink px-3 py-2 ${
            achievement.unlocked ? "bg-complete" : "bg-grid"
          }`}
        >
          <span className="text-2xl" aria-hidden>
            {achievement.icon}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-soot">{achievement.title}</p>
            <p className="mt-0.5 text-xs text-soot/70">{achievement.description}</p>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-soot/60">
              {achievement.unlocked ? (
                <>
                  Unlocked ·{" "}
                  {achievement.unlockedAt?.toLocaleDateString() ?? "recently"} · +{achievement.xpReward}{" "}
                  XP
                </>
              ) : (
                <>{achievement.category} · +{achievement.xpReward} XP</>
              )}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
