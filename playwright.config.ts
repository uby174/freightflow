import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  retries: 1,
  forbidOnly: !!process.env.CI,
  // `next dev` compiles routes on first hit, so the first test per route is slow.
  timeout: 60_000,
  expect: { timeout: 15_000 },
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
