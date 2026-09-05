import { defineConfig, devices } from '@playwright/test';

// In the `e2e` compose profile the Playwright container reaches the `web` service by its Docker
// DNS name on the shared `letsy-dev` network (http://web:4321); locally it defaults to localhost.
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:4321';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
