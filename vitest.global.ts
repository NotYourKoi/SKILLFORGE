import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * One-time test database setup. Runs once before any worker. Creates + migrates
 * the dedicated test.db so per-worker setup only sets environment variables.
 * The app's db.ts is never pointed at dev.db during tests.
 */
const root = path.dirname(fileURLToPath(import.meta.url));
const dbUrl = "file:./test.db";

export default function prepareTestDatabase() {
  process.env.DATABASE_URL = dbUrl;
  process.env.AUTH_SECRET = "skillforge-test-secret";
  process.env.AUTH_TRUST_HOST = "true";

  try {
    execSync("npx prisma migrate deploy", {
      cwd: root,
      shell: process.platform === "win32" ? "cmd.exe" : "/bin/sh",
      stdio: "pipe",
      env: { ...process.env, DATABASE_URL: dbUrl },
    });
  } catch (error) {
    const stdout = (error as { stdout?: Buffer }).stdout?.toString() ?? "";
    const stderr = (error as { stderr?: Buffer }).stderr?.toString() ?? "";
    console.error("Failed to prepare test database (test.db):");
    console.error(stdout);
    console.error(stderr);
    throw error;
  }
}
