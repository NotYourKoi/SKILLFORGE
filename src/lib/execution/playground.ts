import type {
  CodeExecutionProvider,
  ExecutionResult,
  RunRequest,
  SubmitRequest,
  TestResult,
} from "./provider";

const RUST_PLAYGROUND_URL = "https://play.rust-lang.org/execute";
const TIMEOUT_MS = 10_000;
const MAX_OUTPUT_LENGTH = 16_000;

interface PlaygroundResponse {
  success?: boolean;
  exitDetail?: string;
  stdout?: string;
  stderr?: string;
  error?: string;
}

function truncateOutput(text: string): string {
  if (text.length <= MAX_OUTPUT_LENGTH) return text;
  return (
    text.slice(0, MAX_OUTPUT_LENGTH) +
    "\n\n... [Output truncated by SkillForge Runner: character limit reached]"
  );
}

function sanitizeCompilerDiagnostics(stderr: string): string {
  // Strip internal playground file paths (/playground) to make messages cleaner
  return stderr
    .replace(/\/playground\//g, "")
    .replace(/src\/main\.rs:/g, "line ")
    .replace(/playground v0\.0\.1/g, "skillforge_module");
}

export class RustPlaygroundProvider implements CodeExecutionProvider {
  readonly name = "playground";
  readonly executesCode = true;

  async checkHealth(): Promise<{ healthy: boolean; latencyMs?: number }> {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const resp = await fetch(RUST_PLAYGROUND_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "SkillForge-HealthCheck/1.0",
        },
        body: JSON.stringify({
          channel: "stable",
          mode: "debug",
          edition: "2021",
          crateType: "bin",
          tests: false,
          code: "fn main() {}",
          backtrace: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latencyMs = Date.now() - start;
      return { healthy: resp.ok, latencyMs };
    } catch {
      return { healthy: false };
    }
  }

  async run(request: RunRequest): Promise<ExecutionResult> {
    const lang = request.language.toLowerCase();
    if (lang !== "rust" && lang !== "rs") {
      return {
        status: "unavailable",
        stdout: "",
        stderr: "",
        error: `Language "${request.language}" is not currently supported by the Rust Playground runner.`,
      };
    }

    let codeToExecute = request.code;
    // If learner code does not include fn main, wrap top-level expressions or helper invocations
    if (!codeToExecute.includes("fn main")) {
      codeToExecute = `${codeToExecute}\n\nfn main() {\n    println!("SkillForge: Code compiled successfully!");\n}`;
    }

    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(RUST_PLAYGROUND_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "SkillForge-Runner/1.0",
        },
        body: JSON.stringify({
          channel: "stable",
          mode: "debug",
          edition: "2021",
          crateType: "bin",
          tests: false,
          code: codeToExecute,
          backtrace: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const executionTimeMs = Date.now() - start;

      if (!response.ok) {
        if (response.status === 429) {
          return {
            status: "unavailable",
            stdout: "",
            stderr: "",
            error:
              "The Forge Runner is experiencing high traffic. Please cool down for a moment and try again.",
          };
        }
        return {
          status: "unavailable",
          stdout: "",
          stderr: "",
          error:
            "The Forge execution service is currently unreachable. Please try again in a few moments.",
        };
      }

      const data: PlaygroundResponse = await response.json();
      const stdout = truncateOutput(data.stdout || "");
      const stderr = truncateOutput(
        sanitizeCompilerDiagnostics(data.stderr || ""),
      );

      if (data.success === false) {
        return {
          status: "error",
          stdout,
          stderr,
          executionTimeMs,
          error: "Compilation or runtime error occurred.",
        };
      }

      return {
        status: "ok",
        stdout,
        stderr,
        executionTimeMs,
      };
    } catch (err: unknown) {
      const isTimeout =
        err instanceof Error &&
        (err.name === "AbortError" || err.message.includes("aborted"));

      if (isTimeout) {
        return {
          status: "timeout",
          stdout: "",
          stderr: "",
          executionTimeMs: TIMEOUT_MS,
          error: "Execution timed out (10s limit exceeded). Check for infinite loops or heavy blocking operations.",
        };
      }

      return {
        status: "unavailable",
        stdout: "",
        stderr: "",
        error:
          "The Forge Runner could not reach the compilation service. Please check your network connection and retry.",
      };
    }
  }

  async submit(request: SubmitRequest): Promise<ExecutionResult> {
    const lang = request.language.toLowerCase();
    if (lang !== "rust" && lang !== "rs") {
      return {
        status: "unavailable",
        stdout: "",
        stderr: "",
        error: `Language "${request.language}" is not currently supported by the Rust Playground runner.`,
      };
    }

    // Build the test runner harness
    const harnessCode = this.buildTestHarness(request.code, request.testCases);

    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(RUST_PLAYGROUND_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "SkillForge-Runner/1.0",
        },
        body: JSON.stringify({
          channel: "stable",
          mode: "debug",
          edition: "2021",
          crateType: "bin",
          tests: false,
          code: harnessCode,
          backtrace: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const executionTimeMs = Date.now() - start;

      if (!response.ok) {
        if (response.status === 429) {
          return {
            status: "unavailable",
            stdout: "",
            stderr: "",
            error:
              "The Forge Runner is experiencing high traffic. Please cool down for a moment and try again.",
          };
        }
        return {
          status: "unavailable",
          stdout: "",
          stderr: "",
          error:
            "The Forge execution service is currently unreachable. Please try again in a few moments.",
        };
      }

      const data: PlaygroundResponse = await response.json();
      const rawStdout = data.stdout || "";
      const rawStderr = sanitizeCompilerDiagnostics(data.stderr || "");

      // If compilation failed entirely
      if (data.success === false) {
        const testResults: TestResult[] = request.testCases.map((tc, idx) => ({
          order: idx + 1,
          name: tc.isPublic ? `Test Case ${idx + 1}` : `Hidden Test ${idx + 1}`,
          passed: false,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          error: "Compilation failed before tests could execute.",
        }));

        return {
          status: "error",
          stdout: truncateOutput(rawStdout),
          stderr: truncateOutput(rawStderr),
          executionTimeMs,
          error: "Rust compilation failed. Review the compiler diagnostics below.",
          testResults,
        };
      }

      // Parse structured test results from stdout
      const { testResults, cleanStdout, allPassed } = this.parseTestOutput(
        rawStdout,
        request.testCases,
      );

      return {
        status: allPassed ? "ok" : "error",
        stdout: truncateOutput(cleanStdout),
        stderr: truncateOutput(rawStderr),
        executionTimeMs,
        testResults,
      };
    } catch (err: unknown) {
      const isTimeout =
        err instanceof Error &&
        (err.name === "AbortError" || err.message.includes("aborted"));

      if (isTimeout) {
        return {
          status: "timeout",
          stdout: "",
          stderr: "",
          executionTimeMs: TIMEOUT_MS,
          error: "Grading timed out (10s limit exceeded). Check for infinite loops or blocking code.",
        };
      }

      return {
        status: "unavailable",
        stdout: "",
        stderr: "",
        error:
          "The Forge Runner could not reach the compilation service. Please check your network connection and retry.",
      };
    }
  }

  private buildTestHarness(
    userCode: string,
    testCases: SubmitRequest["testCases"],
  ): string {
    // If user code defined fn main, rename it to fn __user_main so test runner main() doesn't conflict
    const safeUserCode = userCode.replace(
      /\bfn\s+main\s*\(\s*\)/g,
      "fn __user_main()",
    );

    const testBlocks = testCases
      .map((tc, idx) => {
        const order = idx + 1;
        const expectedEscaped = JSON.stringify(tc.expectedOutput.trim());
        const expr = tc.input.trim();

        return `    // Test Case ${order}
    {
        let order = ${order};
        let expected = ${expectedEscaped};
        let actual = format!("{}", { ${expr} });
        if actual.trim() == expected.trim() {
            println!("SKILLFORGE_TEST|{}|PASS|{}", order, actual);
        } else {
            println!("SKILLFORGE_TEST|{}|FAIL|{}", order, actual);
        }
    }`;
      })
      .join("\n\n");

    return `// ==================== LEARNER CODE START ====================
#[allow(unused_imports, dead_code, unused_variables, unused_mut)]
${safeUserCode}
// ==================== LEARNER CODE END ======================

#[allow(dead_code, unused_variables, unused_mut)]
fn main() {
${testBlocks}
}
`;
  }

  private parseTestOutput(
    stdout: string,
    testCases: SubmitRequest["testCases"],
  ): { testResults: TestResult[]; cleanStdout: string; allPassed: boolean } {
    const lines = stdout.split("\n");
    const testMap = new Map<
      number,
      { passed: boolean; actualOutput: string }
    >();
    const otherLines: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("SKILLFORGE_TEST|")) {
        const parts = trimmed.split("|");
        const order = parseInt(parts[1], 10);
        const status = parts[2];
        const actual = parts.slice(3).join("|");
        testMap.set(order, {
          passed: status === "PASS",
          actualOutput: actual,
        });
      } else if (trimmed.startsWith("SKILLFORGE_SUMMARY|")) {
        // Handled via individual testMap entries
      } else if (trimmed.length > 0) {
        otherLines.push(line);
      }
    }

    const testResults: TestResult[] = testCases.map((tc, idx) => {
      const order = idx + 1;
      const parsed = testMap.get(order);
      const passed = parsed?.passed ?? false;
      const actualOutput = parsed?.actualOutput ?? "(no result)";

      return {
        order,
        name: tc.isPublic ? `Test Case ${order}` : `Hidden Test ${order}`,
        passed,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput,
        isPublic: tc.isPublic,
      };
    });

    const allPassed =
      testResults.length > 0 && testResults.every((t) => t.passed);
    return {
      testResults,
      cleanStdout: otherLines.join("\n"),
      allPassed,
    };
  }
}

export const playgroundExecutionProvider = new RustPlaygroundProvider();
