import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  // Pure-logic tests — bypass the Tailwind/PostCSS pipeline entirely.
  css: { postcss: { plugins: [] } },
  // SN_DISABLE_AI forces the deterministic path so pricing tests never depend on
  // whether an Anthropic key happens to be configured on this machine.
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    css: false,
    env: { SN_DISABLE_AI: "1" },
  },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
