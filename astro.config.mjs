// @ts-check
import { rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

/**
 * `src/pages/dev/components.astro` is a dev-only visual QA harness (brief W-2 entregable 7): it
 * mounts every shared component against the design handoff for a visual pass, and e2e specs drive
 * it directly. It must exist for `astro dev` (and therefore for the `e2e` compose profile, which
 * runs against the dev server) but never ship in the production build. Astro has no
 * `build.exclude`-style option for this, so this integration deletes `dist/dev/` in the
 * `astro:build:done` hook -- verified by `scripts/check_no_dev_pages.sh` (ratchet, run against
 * `dist/` after `pnpm build`, same pattern as `check_third_party.sh`).
 */
function stripDevPages() {
  return {
    name: 'strip-dev-pages',
    hooks: {
      /** @param {{ dir: URL }} params */
      'astro:build:done': async ({ dir }) => {
        await rm(fileURLToPath(new URL('dev/', dir)), { recursive: true, force: true });
      },
    },
  };
}

// https://astro.build/config
export default defineConfig({
  integrations: [react(), stripDevPages()],
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  vite: {
    server: {
      // Vite's dev-server Host-header allowlist otherwise rejects requests from the `e2e`
      // container, which reaches this service by its Docker Compose DNS name (http://web:4321),
      // not localhost (compose.dev.yml, network letsy-dev).
      allowedHosts: ['web', 'localhost'],
    },
  },
});
