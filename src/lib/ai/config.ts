import type { AIProviderConfig, AIProviderName } from "./types";

export const GEMINI_DEFAULT_MODEL = "gemini-2.0-flash";
export const OMNIROUTE_DEFAULT_MODEL = "gpt-4o-mini";

export const AI_UNAVAILABLE_MESSAGE = "AI Tutor is currently unavailable.";
export const AI_TEMP_UNAVAILABLE_MESSAGE = "AI Tutor is temporarily unavailable.";
export const AI_DISABLED_MESSAGE = "AI Tutor is turned off in your settings.";

function intFromEnv(name: string, fallback: number): number {
  const raw = Number.parseInt((process.env[name] ?? "").trim(), 10);
  return Number.isFinite(raw) && raw > 0 ? raw : fallback;
}

export function isAIProviderName(value: string): value is AIProviderName {
  return value === "gemini" || value === "omniroute";
}

/**
 * Reads AI configuration from server-side environment variables.
 * Returns null when the provider is not configured (AI gracefully unavailable).
 * Never returns secrets to the caller beyond the provider layer.
 */
export function getProviderConfig(): AIProviderConfig | null {
  const provider = (process.env.AI_PROVIDER ?? "").trim().toLowerCase();
  if (!isAIProviderName(provider)) return null;

  const apiKey = (process.env.AI_API_KEY ?? "").trim();
  if (!apiKey) return null;

  const model =
    (process.env.AI_MODEL ?? "").trim() ||
    (provider === "gemini" ? GEMINI_DEFAULT_MODEL : OMNIROUTE_DEFAULT_MODEL);

  return { provider, model, apiKey };
}

export function isAIEnabled(): boolean {
  return getProviderConfig() !== null;
}

export interface AILimits {
  maxMessageLength: number;
  maxCodeLength: number;
  maxHistoryMessages: number;
  maxStoredMessages: number;
  maxOutputTokens: number;
  rateLimitRequests: number;
  rateLimitWindowMs: number;
  requestTimeoutMs: number;
}

export function aiLimits(): AILimits {
  return {
    maxMessageLength: intFromEnv("AI_MAX_MESSAGE_LENGTH", 2000),
    maxCodeLength: intFromEnv("AI_MAX_CODE_LENGTH", 8000),
    maxHistoryMessages: intFromEnv("AI_MAX_HISTORY_MESSAGES", 8),
    maxStoredMessages: intFromEnv("AI_MAX_STORED_MESSAGES", 40),
    maxOutputTokens: intFromEnv("AI_MAX_OUTPUT_TOKENS", 512),
    rateLimitRequests: intFromEnv("AI_RATE_LIMIT_REQUESTS", 10),
    rateLimitWindowMs: intFromEnv("AI_RATE_LIMIT_WINDOW_MS", 60000),
    requestTimeoutMs: intFromEnv("AI_REQUEST_TIMEOUT_MS", 30000),
  };
}
