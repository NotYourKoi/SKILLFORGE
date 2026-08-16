/**
 * Code execution provider contract.
 *
 * SECURITY MODEL
 * --------------
 * SkillForge NEVER executes learner-submitted code on the host machine, in the
 * Next.js process, in Node, or via shell. The only code paths that interact
 * with learner code are:
 *
 *   1. A `CodeExecutionProvider` implementation (server-side only).
 *   2. This module's types, used by provider implementations.
 *
 * The default provider is the local mock (`MockCodeExecutionProvider`), which
 * does NOT run code at all — it reports `status: "unavailable"` with a clear,
 * user-facing message. No fake pass/fail is ever produced.
 *
 * A real provider MUST be an isolated sandbox: a separate container or worker
 * process with no access to the host filesystem, the database, network egress,
 * or environment secrets. See ARCHITECTURE.md for the integration point.
 */

export type ExecutionStatus = "ok" | "error" | "timeout" | "unavailable";

export interface TestCaseInput {
  input: string;
  expectedOutput: string;
  isPublic?: boolean;
}

export interface TestResult {
  order: number;
  name: string;
  passed: boolean;
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  error?: string;
}

export interface RunRequest {
  code: string;
  language: string;
  stdin?: string;
}

export interface SubmitRequest {
  code: string;
  language: string;
  testCases: TestCaseInput[];
}

export interface ExecutionResult {
  status: ExecutionStatus;
  stdout: string;
  stderr: string;
  executionTimeMs?: number;
  error?: string;
  /** Present only for submit requests, aligned by `order`. */
  testResults?: TestResult[];
}

export interface CodeExecutionProvider {
  readonly name: string;
  /** Whether this provider actually executes code. */
  readonly executesCode: boolean;
  run(request: RunRequest): Promise<ExecutionResult>;
  submit(request: SubmitRequest): Promise<ExecutionResult>;
}

/** Maximum size, in characters, of a learner submission. */
export const MAX_CODE_LENGTH = 16_000;

export function codeIsValid(code: string): boolean {
  return code.trim().length > 0 && code.length <= MAX_CODE_LENGTH;
}

export function codeValidationError(code: string): string | null {
  if (code.trim().length === 0) return "Code is empty";
  if (code.length > MAX_CODE_LENGTH) {
    return `Code is too long (max ${MAX_CODE_LENGTH} characters)`;
  }
  return null;
}
