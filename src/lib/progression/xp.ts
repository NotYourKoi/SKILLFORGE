import { prisma } from "@/lib/db";

/**
 * Centralized XP service.
 *
 * XP is always determined server-side. Actions never pass amounts from the
 * client; they call the event-specific award helpers with a reference id.
 * Each (user, reason, referenceId) triple is unique in the XpEvent table, so a
 * repeated award for the same event is a no-op (idempotent).
 */
export const XP_VALUES = {
  LESSON_COMPLETED: 20,
  QUIZ_PASSED: 30,
  EXERCISE_SOLVED: 40,
  PROJECT_MILESTONE: 25,
  PROJECT_COMPLETED: 100,
  COURSE_COMPLETED: 150,
} as const;

/** Reasons with server-determined amounts (no client input). */
export type XpReason = keyof typeof XP_VALUES | "ACHIEVEMENT_UNLOCKED";

export interface XpAward {
  awarded: boolean;
  amount: number;
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: string }).code === "P2002"
  );
}

/**
 * Awards XP for a (reason, referenceId) once. Any later call for the same
 * user/reason/reference returns `awarded: false` without creating a row.
 * `amount` defaults to the central XP table and must be supplied only for
 * reasons not in XP_VALUES (achievement rewards are read from the catalog).
 */
export async function awardXp(
  userId: string,
  reason: XpReason,
  referenceId: string,
  amount?: number,
): Promise<XpAward> {
  const resolvedAmount =
    amount ?? (reason in XP_VALUES ? XP_VALUES[reason as keyof typeof XP_VALUES] : 0);
  if (resolvedAmount <= 0) return { awarded: false, amount: 0 };

  try {
    await prisma.xpEvent.create({
      data: { userId, amount: resolvedAmount, reason, referenceId },
    });
    return { awarded: true, amount: resolvedAmount };
  } catch (error) {
    if (isUniqueViolation(error)) return { awarded: false, amount: 0 };
    throw error;
  }
}

/** Total XP earned by a user across all events. */
export async function getTotalXp(userId: string): Promise<number> {
  const aggregate = await prisma.xpEvent.aggregate({
    where: { userId },
    _sum: { amount: true },
  });
  return aggregate._sum.amount ?? 0;
}
