import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  timeout: 45000,
  expect: { timeout: 15000 },
  fullyParallel: false,
  workers: 1,
  use: { baseURL: process.env.TEST_BASE_URL || "http://127.0.0.1:3000", browserName: "chromium", channel: process.env.PLAYWRIGHT_CHANNEL || "chrome", screenshot: "only-on-failure", trace: "retain-on-failure" },
  reporter: "list",
});
