import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "src"),
    },
  },
  test: {
    environment: "node",
    globalSetup: ["./vitest.global.ts"],
    setupFiles: ["./vitest.setup.ts"],
    fileParallelism: false,
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
