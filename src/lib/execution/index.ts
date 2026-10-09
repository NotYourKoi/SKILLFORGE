import type { CodeExecutionProvider } from "./provider";
import { mockExecutionProvider } from "./mock";
import { playgroundExecutionProvider, RustPlaygroundProvider } from "./playground";

export type { CodeExecutionProvider } from "./provider";
export * from "./provider";
export { mockExecutionProvider } from "./mock";
export { playgroundExecutionProvider, RustPlaygroundProvider } from "./playground";

const registered = new Map<string, () => CodeExecutionProvider>([
  ["mock", () => mockExecutionProvider],
  ["playground", () => playgroundExecutionProvider],
]);

/**
 * Register a provider implementation for a given name. Called from the
 * deployment environment (e.g. an entrypoint or instrumentation file) when a
 * real sandboxed provider is wired up.
 */
export function registerExecutionProvider(
  name: string,
  factory: () => CodeExecutionProvider,
): void {
  registered.set(name, factory);
}

export function executionProviderName(): string {
  return process.env.EXECUTION_PROVIDER || "playground";
}

/**
 * Returns the configured execution provider. Defaults to playground.
 */
export function getExecutionProvider(): CodeExecutionProvider {
  const name = executionProviderName();
  const factory = registered.get(name);
  if (!factory) {
    console.warn(
      `[ExecutionProvider] Unknown provider "${name}", falling back to playground provider.`,
    );
    return playgroundExecutionProvider;
  }
  return factory();
}
