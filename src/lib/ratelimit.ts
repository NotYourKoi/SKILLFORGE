import { prisma } from "@/lib/db";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
  reason?: string;
}

export interface RateLimitOptions {
  key: string;
  limit: number;
  windowSeconds: number;
  actionName?: string;
}

/**
 * Shared rate limiter using Supabase PostgreSQL table.
 * Shared across all serverless instances and cold starts.
 */
export async function checkRateLimit({
  key,
  limit,
  windowSeconds,
  actionName = "execution",
}: RateLimitOptions): Promise<RateLimitResult> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowSeconds * 1000);

  try {
    const bucket = await prisma.rateLimitBucket.findUnique({
      where: { key },
    });

    if (!bucket || bucket.resetAt <= now) {
      // Create or reset bucket
      await prisma.rateLimitBucket.upsert({
        where: { key },
        update: {
          count: 1,
          resetAt,
        },
        create: {
          key,
          count: 1,
          resetAt,
        },
      });

      return {
        allowed: true,
        remaining: limit - 1,
        resetInSeconds: windowSeconds,
      };
    }

    if (bucket.count >= limit) {
      const resetInSeconds = Math.max(
        1,
        Math.ceil((bucket.resetAt.getTime() - now.getTime()) / 1000),
      );
      return {
        allowed: false,
        remaining: 0,
        resetInSeconds,
        reason: `The Forge Runner is cooling down from high load! Please wait ${resetInSeconds}s before your next ${actionName}.`,
      };
    }

    // Increment bucket
    const updated = await prisma.rateLimitBucket.update({
      where: { key },
      data: { count: { increment: 1 } },
    });

    const resetInSeconds = Math.max(
      1,
      Math.ceil((bucket.resetAt.getTime() - now.getTime()) / 1000),
    );

    return {
      allowed: true,
      remaining: Math.max(0, limit - updated.count),
      resetInSeconds,
    };
  } catch (err) {
    // If DB rate-limit query fails, fail-open with safety log so learners aren't blocked
    console.error("[RateLimiter] Database check failed:", err);
    return {
      allowed: true,
      remaining: 1,
      resetInSeconds: windowSeconds,
    };
  }
}
