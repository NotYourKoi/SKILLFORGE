import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(tsx|ts)$/.test(full)) out.push(full);
  }
  return out;
}

const componentsDir = path.join(process.cwd(), "src", "components");
const appDir = path.join(process.cwd(), "src", "app");

describe("AI security boundaries", () => {
  it("never exposes AI server code through client components", () => {
    const clientFiles = [...walk(componentsDir), ...walk(appDir)];
    expect(clientFiles.length).toBeGreaterThan(0);

    const offenders: string[] = [];
    for (const file of clientFiles) {
      const source = readFileSync(file, "utf8");
      // Any VALUE import from the AI server layer would ship secrets/logic to the browser.
      const matches = source.matchAll(
        /^\s*import\s+(?!type\b)(.*?)from\s+["']@\/lib\/ai(?:\/|["'])/gm,
      );
      for (const match of matches) {
        offenders.push(`${file}: ${match[0].trim()}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("does not hard-code an API key in the provider layer", () => {
    const source = readFileSync(path.join(process.cwd(), "src", "lib", "ai", "provider.ts"), "utf8");
    const suspicious = /(api[_-]?key|sk-|AIza[0-9A-Za-z_-]{20,})/i;
    // The only key references must be reading from config, not literals.
    expect(/AIza[0-9A-Za-z_-]{20,}/.test(source)).toBe(false);
    expect(suspicious.test(source)).toBe(true); // it does reference apiKey field names
  });

  it("does not print secrets in logs", () => {
    const source = readFileSync(path.join(process.cwd(), "src", "lib", "ai", "provider.ts"), "utf8");
    expect(source).not.toMatch(/console\.(log|error|warn)/);
  });

  it("reads configuration exclusively from environment variables", () => {
    const source = readFileSync(path.join(process.cwd(), "src", "lib", "ai", "config.ts"), "utf8");
    expect(source).toContain("process.env.AI_PROVIDER");
    expect(source).toContain("process.env.AI_API_KEY");
    expect(source).toContain("process.env.AI_MODEL");
  });

  it("keeps provider selection provider-agnostic (Gemini + OmniRoute, no hard-coded model in UI)", () => {
    const providerSource = readFileSync(path.join(process.cwd(), "src", "lib", "ai", "provider.ts"), "utf8");
    expect(providerSource).toMatch(/gemini/i);
    expect(providerSource).toMatch(/omniroute/i);
    const tutorSource = readFileSync(path.join(process.cwd(), "src", "components", "ai", "tutor.tsx"), "utf8");
    expect(tutorSource).not.toMatch(/gemini|omniroute/i);
  });
});
