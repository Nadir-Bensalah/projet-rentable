import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
export const TEST_DB = process.env.TEST_DATABASE_URL ?? "postgres://postgres@localhost:5432/releveo_e2e";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  globalSetup: "./tests/e2e/global-setup.ts",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    locale: "fr-FR",
    timezoneId: "Europe/Paris",
    acceptDownloads: true,
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : undefined,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, testIgnore: /responsive|mobile/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /responsive|mobile/ },
  ],
  webServer: {
    command: "./scripts/start-standalone.sh",
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      PORT: String(PORT),
      HOSTNAME: "127.0.0.1",
      NODE_ENV: "production",
      APP_URL: `http://localhost:${PORT}`,
      DATABASE_URL: TEST_DB,
      AUTH_SECRET: "e2e-secret-e2e-secret-e2e-secret-e2e-secret",
      PAYMENT_PROVIDER: "mock",
      ALLOW_MOCK_PAYMENTS: "true",
      EMAIL_PROVIDER: "console",
      ADMIN_EMAILS: "admin@example.com",
      CRON_SECRET: "e2e-cron-secret",
      TRUSTED_PROXY_HOPS: "1",
    },
  },
});
