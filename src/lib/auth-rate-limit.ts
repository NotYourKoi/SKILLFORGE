import { headers } from "next/headers";

/**
 * Lightweight in-memory sliding-window rate limiter for auth actions
 * (register + login). Protects against scripted brute-force attempts and
 * accidental retry loops. Not distributed — fine for a single-instance
 * private beta; document any move to multiple instances.
 */

export const AUTH_RATE_LIMIT_REQUESTS = 10;
export const AUTH_RATE_LIMIT_WINDOW_MS = 60_000;
export const AUTH_RATE_LIMIT_MESSAGE =
  "Too many sign-in attempts. Please wait a moment and try again.";

class AuthRateLimiter {
  private hits = new Map<string, number[]>();

  private cleanup(now: number): void {
    for (const [key, timestamps] of this.hits) {
      const kept = timestamps.filter((t) => t > now - AUTH_RATE_LIMIT_WINDOW_MS);
      if (kept.length === 0) this.hits.delete(key);
      else this.hits.set(key, kept);
    }
  }

  hit(key: string): { allowed: boolean; retryAfterMs: number } {
    const now = Date.now();
    this.cleanup(now);

    const existing = this.hits.get(key) ?? [];
    const allowed = existing.length < AUTH_RATE_LIMIT_REQUESTS;
    if (allowed) {
      this.hits.set(key, [...existing, now]);
      return { allowed: true, retryAfterMs: 0 };
    }
    const oldest = existing[0];
    return {
      allowed: false,
      retryAfterMs: Math.max(0, oldest + AUTH_RATE_LIMIT_WINDOW_MS - now),
    };
  }

  reset(key?: string): void {
    if (key) this.hits.delete(key);
    else this.hits.clear();
  }
}

export const authRateLimiter = new AuthRateLimiter();

/**
 * Stable per-request identity for auth throttling: the client IP when the
 * reverse proxy forwards it. Values are only used as limiter keys — never
 * logged or persisted.
 *
 * Returns `undefined` when no client identity can be determined (no request
 * scope, or a proxy that forwards neither header). Callers should then skip
 * throttling rather than share a single fallback key (a shared key would make
 * every user collectively consume the budget and could be abused).
 */
export async function authRateLimitKey(): Promise<string | undefined> {
  try {
    const headerList = await headers();
    const forwarded = headerList.get("x-forwarded-for");
    const ip =
      (forwarded ?? "").split(",")[0]?.trim() ||
      headerList.get("x-real-ip");
    return ip ? `auth:${ip}` : undefined;
  } catch {
    return undefined;
  }
}
