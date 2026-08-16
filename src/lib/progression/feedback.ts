/**
 * Lightweight feedback returned by server actions after a meaningful learning
 * action. There is no persistent notification system (see ARCHITECTURE.md).
 */
export interface FeedbackUnlock {
  id: string;
  title: string;
}

export interface GamificationFeedback {
  /** XP newly awarded by this action (0 when the event already awarded). */
  xp: number;
  /** Current streak after this action (0 when not applicable). */
  streak: number;
  /** Achievements unlocked by this action. */
  unlocked: FeedbackUnlock[];
}

export function emptyFeedback(): GamificationFeedback {
  return { xp: 0, streak: 0, unlocked: [] };
}

export function hasFeedback(feedback: GamificationFeedback | null | undefined): boolean {
  return (
    feedback !== null &&
    feedback !== undefined &&
    (feedback.xp > 0 || feedback.streak > 0 || feedback.unlocked.length > 0)
  );
}
