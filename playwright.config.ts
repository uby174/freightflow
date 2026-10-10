import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  retries: 1,
  forbidOnly: !!process.env.CI,
  // `next dev` compiles each route on first hit (and again after ~60s idle):
  // 7-16s per route on a laptop, so budgets are generous.
  timeout: 90_000,
  expect: { timeout: 30_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3004",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3004",
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      SN_DISABLE_AI: "1",
      NEXT_PUBLIC_FREIGHTFLOW_TENANT: "sn-groupage",
    },
  },
});
