// @ts-check
import { rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import { securityHeaders } from './scripts/security-headers.mjs';
import { waitlistMockPlugin } from './scripts/dev/waitlist-mock.mjs';

// Docker Compose already puts .env's variables (and, for the `web` service, its own
// `environment:` override) directly into process.env before Node starts (env_file/environment),
// same as PUBLIC_GA_LAUNCHED already relies on -- no extra .env loading needed here.
const waitlistEndpoint = process.env.PUBLIC_WAITLIST_ENDPOINT ?? '';

// Canonical origin for every absolute URL the build emits (brief W-8, .env.example's own comment):
// canonical link, hreflang alternates, og:url, sitemap.xml, schema.org JSON-LD. `Astro.site` is what
// makes `astro:sitemap`-style absolute-URL helpers (here, our own src/lib/seo.ts) resolve without
// each call site hardcoding a domain. Provisional default matches .env.example until the real domain
// (workspace 🔴) is confirmed.
const siteUrl = process.env.PUBLIC_SITE_URL ?? 'https://letsylabs.com';

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
  site: siteUrl,
  integrations: [react(), stripDevPages(), securityHeaders({ endpoint: waitlistEndpoint })],
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  vite: {
    // `apply: 'serve'` (set inside the plugin itself, brief W-7): only mounted under `astro dev`,
    // never in `astro build` -- the mock's /__dev/waitlist route must never ship in `dist/`.
    plugins: [waitlistMockPlugin()],
    build: {
      // D-W7-4's script-src 'self' is strict (zero inline <script> allowed in dist/). Astro's
      // default build INLINES any per-page script bundle under Vite's `assetsInlineLimit` (4096
      // bytes) that ends up with no remaining imports after tree-shaking -- true for several small
      // scripts already in this repo (e.g. SiteNav's nav.ts, only imported from one place). Forcing
      // the limit to 0 makes every script chunk (this repo has no imported images/fonts for it to
      // otherwise affect -- self-hosted fonts live in public/, referenced by plain CSS url(), never
      // through Vite's asset pipeline) always emit as an external `<script src>` file instead.
      // Verified by scripts/check_headers.mjs / scripts/check_headers.test.mjs.
      assetsInlineLimit: 0,
    },
    server: {
      // Vite's dev-server Host-header allowlist otherwise rejects requests from the `e2e`
      // container, which reaches this service by its Docker Compose DNS name (http://web:4321),
      // not localhost (compose.dev.yml, network letsy-dev).
      allowedHosts: ['web', 'localhost'],
    },
  },
});
