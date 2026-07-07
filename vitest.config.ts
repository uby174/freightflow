import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  // Pure-logic tests — bypass the Tailwind/PostCSS pipeline entirely.
  css: { postcss: { plugins: [] } },
  test: { environment: "node", include: ["src/**/*.test.ts"], css: false },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
