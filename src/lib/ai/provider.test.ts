import { afterEach, describe, expect, it, vi } from "vitest";
import {
  GeminiProvider,
  OpenAICompatibleProvider,
  ProviderError,
  getAIProvider,
} from "./provider";
import { getProviderConfig, isAIEnabled } from "./config";
import { GEMINI_DEFAULT_MODEL, OMNIROUTE_DEFAULT_MODEL } from "./config";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function geminiPayload(text = "Tutor reply") {
  return {
    candidates: [{ content: { parts: [{ text }] } }],
    usageMetadata: { promptTokenCount: 12, candidatesTokenCount: 7 },
  };
}

function chatPayload(text = "Tutor reply") {
  return {
    choices: [{ message: { content: text } }],
    usage: { prompt_tokens: 9, completion_tokens: 4 },
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("provider configuration", () => {
  it("is disabled when AI_PROVIDER is missing", () => {
    vi.stubEnv("AI_PROVIDER", "");
    vi.stubEnv("AI_API_KEY", "");
    expect(getProviderConfig()).toBeNull();
    expect(isAIEnabled()).toBe(false);
    expect(getAIProvider()).toBeNull();
  });

  it("is disabled when the API key is missing", () => {
    vi.stubEnv("AI_PROVIDER", "gemini");
    vi.stubEnv("AI_API_KEY", "");
    expect(getProviderConfig()).toBeNull();
    expect(getAIProvider()).toBeNull();
  });

  it("is disabled for an unknown provider value", () => {
    vi.stubEnv("AI_PROVIDER", "grok");
    vi.stubEnv("AI_API_KEY", "secret-key");
    expect(getProviderConfig()).toBeNull();
  });

  it("selects Gemini with the default model", () => {
    vi.stubEnv("AI_PROVIDER", "gemini");
    vi.stubEnv("AI_API_KEY", "test-key");
    vi.stubEnv("AI_MODEL", "");
    const provider = getAIProvider();
    expect(provider).not.toBeNull();
    expect(provider!.name).toBe("gemini");
    expect(provider!.model).toBe(GEMINI_DEFAULT_MODEL);
  });

  it("honors a configured model name", () => {
    vi.stubEnv("AI_PROVIDER", "gemini");
    vi.stubEnv("AI_API_KEY", "test-key");
    vi.stubEnv("AI_MODEL", "gemini-custom-v1");
    expect(getAIProvider()!.model).toBe("gemini-custom-v1");
  });

  it("selects OmniRoute when base URL is configured", () => {
    vi.stubEnv("AI_PROVIDER", "omniroute");
    vi.stubEnv("AI_API_KEY", "test-key");
    vi.stubEnv("AI_MODEL", "");
    vi.stubEnv("AI_OMNIROUTE_BASE_URL", "https://omniroute.example/api/v1");
    const provider = getAIProvider();
    expect(provider).not.toBeNull();
    expect(provider!.name).toBe("omniroute");
    expect(provider!.model).toBe(OMNIROUTE_DEFAULT_MODEL);
  });

  it("falls back to unavailable when OmniRoute has no base URL", () => {
    vi.stubEnv("AI_PROVIDER", "omniroute");
    vi.stubEnv("AI_API_KEY", "test-key");
    vi.stubEnv("AI_OMNIROUTE_BASE_URL", "");
    expect(getAIProvider()).toBeNull();
  });

  it("does not require OmniRoute to be configured for Gemini to work", () => {
    vi.stubEnv("AI_PROVIDER", "gemini");
    vi.stubEnv("AI_API_KEY", "test-key");
    vi.stubEnv("AI_OMNIROUTE_BASE_URL", "");
    expect(getAIProvider()!.name).toBe("gemini");
  });
});

describe("GeminiProvider", () => {
  it("returns the model text and usage metadata", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(geminiPayload("Hello from Gemini")));
    vi.stubGlobal("fetch", fetchMock);

    const provider = new GeminiProvider({ provider: "gemini", model: "test-model", apiKey: "k" });
    const result = await provider.chat([{ role: "user", content: "hi" }]);

    expect(result.content).toBe("Hello from Gemini");
    expect(result.provider).toBe("gemini");
    expect(result.model).toBe("test-model");
    expect(result.promptTokens).toBe(12);
    expect(result.completionTokens).toBe(7);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("test-model");
    expect(String(url)).toContain("generateContent");
    expect((init as RequestInit).headers).toMatchObject({ "x-goog-api-key": "k" });
    const body = JSON.parse(String((init as RequestInit).body));
    expect(body.contents[0].role).toBe("user");
  });

  it("throws ProviderError on network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    const provider = new GeminiProvider({ provider: "gemini", model: "m", apiKey: "k" });
    await expect(provider.chat([{ role: "user", content: "hi" }])).rejects.toBeInstanceOf(ProviderError);
  });

  it("throws ProviderError with status on invalid API key", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ error: "forbidden" }, 403)));
    const provider = new GeminiProvider({ provider: "gemini", model: "m", apiKey: "wrong" });
    try {
      await provider.chat([{ role: "user", content: "hi" }]);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(ProviderError);
      expect((error as ProviderError).status).toBe(403);
    }
  });

  it("throws ProviderError on malformed response (no candidates)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ candidates: [] })));
    const provider = new GeminiProvider({ provider: "gemini", model: "m", apiKey: "k" });
    await expect(provider.chat([{ role: "user", content: "hi" }])).rejects.toThrow(/empty candidates/);
  });

  it("throws ProviderError on empty text", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(geminiPayload("  "))));
    const provider = new GeminiProvider({ provider: "gemini", model: "m", apiKey: "k" });
    await expect(provider.chat([{ role: "user", content: "hi" }])).rejects.toThrow(/missing text/);
  });

  it("throws ProviderError on invalid JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html>not json</html>", { status: 200 })));
    const provider = new GeminiProvider({ provider: "gemini", model: "m", apiKey: "k" });
    await expect(provider.chat([{ role: "user", content: "hi" }])).rejects.toThrow(/invalid JSON/);
  });
});

describe("OpenAICompatibleProvider (OmniRoute)", () => {
  it("returns the model text and usage metadata", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(chatPayload("Omni reply")));
    vi.stubGlobal("fetch", fetchMock);

    const provider = new OpenAICompatibleProvider({
      provider: "omniroute",
      model: "omniroute-model",
      apiKey: "k",
      baseUrl: "https://omniroute.example/api/v1/",
    });
    const result = await provider.chat([{ role: "user", content: "hi" }]);

    expect(result.content).toBe("Omni reply");
    expect(result.provider).toBe("omniroute");
    expect(result.model).toBe("omniroute-model");
    expect(result.promptTokens).toBe(9);
    expect(result.completionTokens).toBe(4);

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://omniroute.example/api/v1/chat/completions");
    expect((init as RequestInit).headers).toMatchObject({
      Authorization: "Bearer k",
    });
  });

  it("requires a base URL at construction", () => {
    expect(
      () =>
        new OpenAICompatibleProvider({
          provider: "omniroute",
          model: "m",
          apiKey: "k",
        }),
    ).toThrow(ProviderError);
  });

  it("throws ProviderError on malformed response (empty choices)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ choices: [] })));
    const provider = new OpenAICompatibleProvider({
      provider: "omniroute",
      model: "m",
      apiKey: "k",
      baseUrl: "https://x.example",
    });
    await expect(provider.chat([{ role: "user", content: "hi" }])).rejects.toThrow(/empty choices/);
  });

  it("throws ProviderError when the service is rate limited", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ error: "rate limited" }, 429)));
    const provider = new OpenAICompatibleProvider({
      provider: "omniroute",
      model: "m",
      apiKey: "k",
      baseUrl: "https://x.example",
    });
    try {
      await provider.chat([{ role: "user", content: "hi" }]);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(ProviderError);
      expect((error as ProviderError).status).toBe(429);
    }
  });
});

describe("provider interface", () => {
  it("exposes a uniform chat interface across providers", () => {
    const gemini = new GeminiProvider({ provider: "gemini", model: "m", apiKey: "k" });
    const omni = new OpenAICompatibleProvider({
      provider: "omniroute",
      model: "m",
      apiKey: "k",
      baseUrl: "https://x.example",
    });
    for (const provider of [gemini, omni]) {
      expect(typeof provider.chat).toBe("function");
      expect(typeof provider.name).toBe("string");
      expect(typeof provider.model).toBe("string");
    }
  });
});
