import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Unit tests only: Playwright's e2e specs live under e2e/ and run via `pnpm e2e`, not vitest.
    include: ['src/**/*.test.{ts,tsx,js,mjs}', 'scripts/**/*.test.{ts,mjs}'],
  },
});
