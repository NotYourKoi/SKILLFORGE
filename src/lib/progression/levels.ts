/**
 * Deterministic level system. Levels are derived purely from total XP so the
 * maths is stable and easy to test. Tune `XP_PER_LEVEL` here to adjust pacing.
 */
export const XP_PER_LEVEL = 500;

export interface LevelInfo {
  level: number;
  totalXp: number;
  /** XP earned within the current level (0..XP_PER_LEVEL). */
  intoLevel: number;
  /** XP required to fill the current level bar. */
  xpForCurrent: number;
  /** XP remaining until the next level. */
  xpToNext: number;
  /** 0..100 progress through the current level. */
  percent: number;
}

/** Pure: maps total XP to a level + in-level progress. */
export function levelFromXp(totalXp: number): LevelInfo {
  const safe = Math.max(0, Math.floor(totalXp));
  const level = Math.floor(safe / XP_PER_LEVEL) + 1;
  const intoLevel = safe - (level - 1) * XP_PER_LEVEL;
  const xpToNext = XP_PER_LEVEL - intoLevel;
  const percent = Math.round((intoLevel / XP_PER_LEVEL) * 100);
  return {
    level,
    totalXp: safe,
    intoLevel,
    xpForCurrent: XP_PER_LEVEL,
    xpToNext,
    percent,
  };
}
