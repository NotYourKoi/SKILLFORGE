import { aiLimits } from "./config";

/**
 * Minimal in-memory sliding-window rate limiter.
 * Sufficient for basic server-side protection (unlimited request loops,
 * accidental retries). Not a distributed limiter.
 */
export class RateLimiter {
  private hits = new Map<string, number[]>();

  private cleanup(now: number, windowMs: number): void {
    for (const [key, timestamps] of this.hits) {
      const kept = timestamps.filter((t) => t > now - windowMs);
      if (kept.length === 0) this.hits.delete(key);
      else this.hits.set(key, kept);
    }
  }

  hit(key: string): { allowed: boolean; retryAfterMs: number } {
    const limits = aiLimits();
    const now = Date.now();
    this.cleanup(now, limits.rateLimitWindowMs);

    const existing = this.hits.get(key) ?? [];
    const allowed = existing.length < limits.rateLimitRequests;
    if (allowed) {
      this.hits.set(key, [...existing, now]);
      return { allowed: true, retryAfterMs: 0 };
    }
    const oldest = existing[0];
    return {
      allowed: false,
      retryAfterMs: Math.max(0, oldest + limits.rateLimitWindowMs - now),
    };
  }

  reset(key?: string): void {
    if (key) this.hits.delete(key);
    else this.hits.clear();
  }
}

export const globalRateLimiter = new RateLimiter();
