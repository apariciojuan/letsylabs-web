import { defineConfig, devices } from '@playwright/test';

// In the `e2e` compose profile the Playwright container reaches the `web` service by its Docker
// DNS name on the shared `letsy-dev` network (http://web:4321); locally it defaults to localhost.
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:4321';

export default defineConfig({
  testDir: './e2e',
  // Debt W8-D1 / brief W-9: warms every route (both locales) sequentially before any test worker
  // starts, so a cold `astro dev` (right after `up -d web`) never races a test's own timeout budget
  // to compile a page for the first time. See e2e/global-setup.ts's doc comment.
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: true,
  // The `e2e` compose service has a 2GB mem_limit. W-2 added a dev QA page
  // (src/pages/dev/components.astro) that runs several animations at once (multiple
  // PipelineDiagram CSS offset-path pulses, the interactive island's own rAF loop, scroll-reveal/
  // counter IntersectionObservers); Chromium's renderer crashed outright when several parallel
  // workers each opened that page in their own context at the same time (observed: "Page crashed"
  // / stale empty locators mid-test). One worker trades wall-clock time for staying inside the
  // container's memory budget -- same trade-off as vitest.config.ts's `fileParallelism: false`.
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
