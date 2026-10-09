import { createHash } from "crypto";
import { prisma } from "@/lib/db";
import type { ExecutionResult, TestResult } from "./provider";

export function computeExecutionCacheKey(
  language: string,
  exerciseId: string,
  code: string,
): string {
  const normalizedCode = code.replace(/\r\n/g, "\n").trim();
  const raw = `${language}:${exerciseId}:${normalizedCode}`;
  return createHash("sha256").update(raw).digest("hex");
}

export async function getCachedExecution(
  cacheKey: string,
): Promise<ExecutionResult | null> {
  try {
    const entry = await prisma.executionCache.findUnique({
      where: { cacheKey },
    });

    if (!entry || entry.expiresAt <= new Date()) {
      return null;
    }

    let testResults: TestResult[] | undefined;
    if (entry.testJson) {
      try {
        testResults = JSON.parse(entry.testJson);
      } catch {
        // ignore parse error
      }
    }

    return {
      status: entry.status as ExecutionResult["status"],
      stdout: entry.stdout,
      stderr: entry.stderr,
      error: entry.error ?? undefined,
      testResults,
    };
  } catch (err) {
    console.error("[ExecutionCache] Lookup failed:", err);
    return null;
  }
}

export async function setCachedExecution(
  cacheKey: string,
  result: ExecutionResult,
  ttlSeconds = 300,
): Promise<void> {
  // Only cache deterministic successes/failures (don't cache temporary timeouts/unavailables)
  if (result.status !== "ok" && result.status !== "error") {
    return;
  }

  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  const testJson = result.testResults ? JSON.stringify(result.testResults) : null;

  try {
    await prisma.executionCache.upsert({
      where: { cacheKey },
      update: {
        status: result.status,
        stdout: result.stdout,
        stderr: result.stderr,
        error: result.error ?? null,
        testJson,
        expiresAt,
      },
      create: {
        cacheKey,
        status: result.status,
        stdout: result.stdout,
        stderr: result.stderr,
        error: result.error ?? null,
        testJson,
        expiresAt,
      },
    });
  } catch (err) {
    console.error("[ExecutionCache] Save failed:", err);
  }
}
