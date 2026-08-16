import type { CodeExecutionProvider } from "./provider";
import { mockExecutionProvider } from "./mock";

export type { CodeExecutionProvider } from "./provider";
export * from "./provider";
export { mockExecutionProvider } from "./mock";

const registered = new Map<string, () => CodeExecutionProvider>([
  ["mock", () => mockExecutionProvider],
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
  return process.env.EXECUTION_PROVIDER || "mock";
}

/**
 * Returns the configured execution provider. Defaults to the local mock,
 * which never executes learner code.
 *
 * If a provider name is configured but not registered, this throws loudly
 * rather than silently falling back — a misconfigured runner must not pretend
 * to work.
 */
export function getExecutionProvider(): CodeExecutionProvider {
  const name = executionProviderName();
  const factory = registered.get(name);
  if (!factory) {
    throw new Error(
      `Execution provider "${name}" is configured but not registered. ` +
        "Provide an EXECUTION_PROVIDER registered in registerExecutionProvider(), " +
        "or unset the env var to use the safe local mock.",
    );
  }
  return factory();
}
