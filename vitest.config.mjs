import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["scripts/**/*.mjs"],
      provider: "v8",
      reporter: ["text", "json-summary"],
      thresholds: {
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100,
      },
    },
    testTimeout: 120_000,
  },
});
