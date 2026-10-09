import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * One-time test database setup. Runs once before any worker. Creates + migrates
 * the dedicated test.db so per-worker setup only sets environment variables.
 * The app's db.ts is never pointed at dev.db during tests.
 */
const root = path.dirname(fileURLToPath(import.meta.url));

export default function prepareTestDatabase() {
  process.env.AUTH_SECRET = process.env.AUTH_SECRET || "skillforge-test-secret";
  process.env.AUTH_TRUST_HOST = "true";

  // If already pointed to PostgreSQL (e.g. Supabase), schema is managed by db push
  if (process.env.DATABASE_URL?.startsWith("postgres")) {
    return;
  }
}
