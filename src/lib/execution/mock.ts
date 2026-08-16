import type {
  CodeExecutionProvider,
  ExecutionResult,
  RunRequest,
  SubmitRequest,
} from "./provider";

/**
 * Local mock execution provider.
 *
 * This is the DEFAULT provider for local development. It deliberately does NOT
 * execute learner code — no child_process, no eval, no shell, no files. Every
 * run/submit resolves to `status: "unavailable"` so the UI and the learner
 * always see a clear, honest message instead of fabricated results.
 *
 * A real provider can be wired behind the same interface; see
 * `getExecutionProvider()` and ARCHITECTURE.md.
 */
export class MockCodeExecutionProvider implements CodeExecutionProvider {
  readonly name = "local-mock";
  readonly executesCode = false;

  private unavailable(): ExecutionResult {
    return {
      status: "unavailable",
      stdout: "",
      stderr: "",
      error:
        "Code execution is not available in this environment. Your code was not run. " +
        "This app uses a local mock runner during development; a safe sandbox is wired " +
        "in production. Keep coding — your progress is still saved.",
    };
  }

  run(_request: RunRequest): Promise<ExecutionResult> {
    return Promise.resolve(this.unavailable());
  }

  submit(_request: SubmitRequest): Promise<ExecutionResult> {
    return Promise.resolve(this.unavailable());
  }
}

export const mockExecutionProvider = new MockCodeExecutionProvider();
