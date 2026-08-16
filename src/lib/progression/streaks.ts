import { prisma } from "@/lib/db";

/**
 * Learning streak tracking.
 *
 * A streak day counts when the user completes a meaningful learning action
 * (lesson, passed quiz, solved exercise, project milestone, skill/course).
 * Merely opening the website never counts.
 *
 * Dates are bucketed by UTC day ("application timezone") so the logic is
 * deterministic and testable. `computeStreakUpdate` is pure; `updateStreak`
 * persists it. Displayed streaks go stale (drop to 0) once a whole day passes
 * with no activity — see `getLiveStreak`.
 */
const DAY_MS = 24 * 60 * 60 * 1000;

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: Date | null;
}

/** UTC day key, e.g. "2026-08-14". */
export function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Converts a UTC day key back to a midnight Date in UTC. */
export function dayKeyToDate(key: string): Date {
  return new Date(`${key}T00:00:00.000Z`);
}

/** Whole UTC days between two dates (positive when a is later than b). */
export function daysBetween(a: Date, b: Date): number {
  const ms = dayKeyToDate(dayKey(a)).getTime() - dayKeyToDate(dayKey(b)).getTime();
  return Math.round(ms / DAY_MS);
}

/**
 * Pure streak transition for one activity on `activityDate`.
 * Same-day activity is a no-op; an activity the next day extends the streak by
 * one; any larger gap (or first ever activity) restarts the streak at 1.
 */
export function computeStreakUpdate(
  state: StreakState,
  activityDate: Date,
): StreakState {
  const today = dayKeyToDate(dayKey(activityDate));

  if (state.lastActiveDate) {
    const lastKey = dayKey(state.lastActiveDate);
    if (lastKey === dayKey(activityDate)) return state;
    const gap = daysBetween(activityDate, state.lastActiveDate);
    if (gap === 1) {
      const currentStreak = state.currentStreak + 1;
      return {
        currentStreak,
        longestStreak: Math.max(state.longestStreak, currentStreak),
        lastActiveDate: today,
      };
    }
  }

  return {
    currentStreak: 1,
    longestStreak: Math.max(state.longestStreak, 1),
    lastActiveDate: today,
  };
}

/**
 * Persists the streak update for a meaningful learning action.
 * Returns the new stored state.
 */
export async function updateStreak(
  userId: string,
  activityDate: Date = new Date(),
): Promise<StreakState> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currentStreak: true, longestStreak: true, lastActiveDate: true },
  });
  if (!user) {
    throw new Error("User not found");
  }
  const next = computeStreakUpdate(
    {
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      lastActiveDate: user.lastActiveDate,
    },
    activityDate,
  );

  await prisma.user.update({
    where: { id: userId },
    data: {
      currentStreak: next.currentStreak,
      longestStreak: next.longestStreak,
      lastActiveDate: next.lastActiveDate,
    },
  });

  return next;
}

/**
 * Live streak as shown in the UI: if no activity happened yesterday or today
 * the stored current streak is considered broken and displayed as 0 (it will
 * reset properly on the next activity). `now` is injectable for tests.
 */
export function getLiveStreak(
  stored: { currentStreak: number; longestStreak: number; lastActiveDate: Date | null },
  now: Date = new Date(),
): StreakState {
  const { currentStreak, longestStreak, lastActiveDate } = stored;
  if (!lastActiveDate) {
    return { currentStreak: 0, longestStreak, lastActiveDate: null };
  }
  const gap = daysBetween(now, lastActiveDate);
  const live = gap <= 1 ? currentStreak : 0;
  return { currentStreak: live, longestStreak, lastActiveDate };
}

/** Reads the user's stored streak fields. */
export async function getStoredStreak(userId: string): Promise<StreakState> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currentStreak: true, longestStreak: true, lastActiveDate: true },
  });
  if (!user) {
    return { currentStreak: 0, longestStreak: 0, lastActiveDate: null };
  }
  return {
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    lastActiveDate: user.lastActiveDate,
  };
}
