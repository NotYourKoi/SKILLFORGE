import {
  aiLimits,
  getProviderConfig,
} from "./config";
import type {
  AIProvider,
  AIProviderConfig,
  AIProviderResult,
  AIProviderName,
  AIChatMessage,
  AIChatOptions,
} from "./types";

export const GEMINI_API_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta";

export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

function assertString(value: unknown, what: string): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ProviderError(`Malformed provider response: missing ${what}`);
  }
}

function intOrZero(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : 0;
}

export class GeminiProvider implements AIProvider {
  readonly name: AIProviderName = "gemini";
  readonly model: string;

  constructor(config: AIProviderConfig) {
    this.model = config.model;
    this.apiKey = config.apiKey;
  }

  private apiKey: string;

  async chat(
    messages: AIChatMessage[],
    options?: AIChatOptions,
  ): Promise<AIProviderResult> {
    const limits = aiLimits();
    const startedAt = Date.now();
    const timeoutMs = options?.timeoutMs ?? limits.requestTimeoutMs;
    const maxOutputTokens = options?.maxOutputTokens ?? limits.maxOutputTokens;

    const body = {
      contents: messages
        .filter((m) => m.content.trim().length > 0)
        .map((m) => ({
          role: m.role === "assistant" ? "model" : m.role,
          parts: [{ text: m.content }],
        })),
      generationConfig: { maxOutputTokens },
    };

    const url = `${GEMINI_API_ENDPOINT}/models/${encodeURIComponent(this.model)}:generateContent`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": this.apiKey,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      throw new ProviderError(
        `Network failure while contacting Gemini: ${errorMessage(error)}`,
      );
    }

    if (!response.ok) {
      throw new ProviderError(
        `Gemini request failed with status ${response.status}`,
        response.status,
      );
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new ProviderError("Malformed provider response: invalid JSON");
    }

    const text = extractGeminiText(data);
    const usage = usageFromGemini(data);

    return {
      content: text,
      provider: this.name,
      model: this.model,
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      durationMs: Date.now() - startedAt,
    };
  }
}

export class OpenAICompatibleProvider implements AIProvider {
  readonly name: AIProviderName;
  readonly model: string;

  constructor(config: AIProviderConfig) {
    if (!config.baseUrl || config.baseUrl.trim().length === 0) {
      throw new ProviderError("OpenAI-compatible provider requires a base URL");
    }
    this.name = config.provider;
    this.model = config.model;
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
  }

  private apiKey: string;
  private baseUrl: string;

  async chat(
    messages: AIChatMessage[],
    options?: AIChatOptions,
  ): Promise<AIProviderResult> {
    const limits = aiLimits();
    const startedAt = Date.now();
    const timeoutMs = options?.timeoutMs ?? limits.requestTimeoutMs;
    const maxOutputTokens = options?.maxOutputTokens ?? limits.maxOutputTokens;

    const url = `${this.baseUrl}/chat/completions`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          max_tokens: maxOutputTokens,
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      throw new ProviderError(
        `Network failure while contacting ${this.name}: ${errorMessage(error)}`,
      );
    }

    if (!response.ok) {
      throw new ProviderError(
        `${this.name} request failed with status ${response.status}`,
        response.status,
      );
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new ProviderError("Malformed provider response: invalid JSON");
    }

    const text = extractChatCompletionsText(data);
    const usage = usageFromChatCompletions(data);

    return {
      content: text,
      provider: this.name,
      model: this.model,
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      durationMs: Date.now() - startedAt,
    };
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.name === "TimeoutError" || error.name === "AbortError"
      ? "request timed out"
      : error.message;
  }
  return String(error);
}

function extractGeminiText(data: unknown): string {
  const candidates = (data as { candidates?: unknown[] } | null)?.candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) {
    throw new ProviderError("Malformed provider response: empty candidates");
  }
  const parts = (candidates[0] as { content?: { parts?: unknown[] } } | null)
    ?.content?.parts;
  if (!Array.isArray(parts)) {
    throw new ProviderError("Malformed provider response: no content parts");
  }
  const text = parts
    .map((part) => (part as { text?: unknown } | null)?.text ?? "")
    .join("");
  assertString(text, "text");
  return text;
}

function extractChatCompletionsText(data: unknown): string {
  const choices = (data as { choices?: unknown[] } | null)?.choices;
  if (!Array.isArray(choices) || choices.length === 0) {
    throw new ProviderError("Malformed provider response: empty choices");
  }
  const content = (choices[0] as { message?: { content?: unknown } } | null)
    ?.message?.content;
  assertString(content, "content");
  return content;
}

function usageFromGemini(data: unknown): {
  promptTokens: number;
  completionTokens: number;
} {
  const metadata = (data as { usageMetadata?: { promptTokenCount?: unknown; candidatesTokenCount?: unknown } } | null)?.usageMetadata;
  return {
    promptTokens: intOrZero(metadata?.promptTokenCount),
    completionTokens: intOrZero(metadata?.candidatesTokenCount),
  };
}

function usageFromChatCompletions(data: unknown): {
  promptTokens: number;
  completionTokens: number;
} {
  const usage = (data as { usage?: { prompt_tokens?: unknown; completion_tokens?: unknown } } | null)?.usage;
  return {
    promptTokens: intOrZero(usage?.prompt_tokens),
    completionTokens: intOrZero(usage?.completion_tokens),
  };
}

/**
 * Factory that selects a provider from environment configuration.
 * Returns null when no provider is configured or the provider cannot be built —
 * callers must treat this as "AI unavailable" and continue gracefully.
 */
export function getAIProvider(): AIProvider | null {
  const config = getProviderConfig();
  if (!config) return null;

  if (config.provider === "gemini") {
    return new GeminiProvider(config);
  }

  const baseUrl = (process.env.AI_OMNIROUTE_BASE_URL ?? "").trim();
  if (!baseUrl) return null;

  return new OpenAICompatibleProvider({ ...config, baseUrl });
}

export type { AIProvider, AIProviderResult, AIChatMessage, AIChatOptions };
