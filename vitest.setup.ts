/**
 * Per-worker setup: point the app at the dedicated test database before any
 * test module imports db.ts. dotenv/config (loaded by db.ts) does not override
 * environment variables, so these values win. The database itself is created
 * and migrated once in vitest.global.ts.
 */
process.env.DATABASE_URL = "file:./test.db";
process.env.AUTH_SECRET = "skillforge-test-secret";
process.env.AUTH_TRUST_HOST = "true";
