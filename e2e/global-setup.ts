import { SITE_PATHS } from '../src/lib/site-routes.ts';
import { locales } from '../src/i18n/index.ts';
import { localizePath } from '../src/i18n/routing.ts';

/**
 * Warms up the dev server before the e2e suite runs (brief W-9, debt W8-D1): on a COLD `astro dev`
 * (right after `up -d web`, before anything has requested a page yet), Vite/Astro compiles each route
 * on demand on its first request. The very first full battery run after `up -d web` failed once in
 * `home.spec.ts` on `h1`/`.ticker` visibility for exactly this reason -- the dev server was still
 * compiling under load from several parallel-ish requests; the retry (`home.spec.ts` alone) passed
 * immediately once warm, and a full re-run was 173/173.
 *
 * Fix is to warm, not to retry (per the brief: "sin reintentos globales"): request every real route,
 * in both locales, ONE AT A TIME, before Playwright starts the actual test workers -- so every page's
 * first compile happens here, sequentially, with no test's timeout budget at stake. `SITE_PATHS`
 * (`src/lib/site-routes.ts`) is the same single source of truth `no-overflow.spec.ts` already uses,
 * so a new page is swept in here automatically too.
 */
export default async function globalSetup() {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:4321';
  const routes = SITE_PATHS.flatMap((path) => locales.map((locale) => localizePath(path, locale)));

  for (const route of routes) {
    try {
      // Deliberately sequential (not Promise.all), see doc comment above.
      const response = await fetch(`${baseURL}${route}`, {
        signal: AbortSignal.timeout(15_000),
      });
      // Draining the body matters here: Astro's dev server finishes compiling a route as it
      // streams the response, not merely once headers are sent.
      await response.text();
    } catch (error) {
      // Best-effort warmup: if a route fails to warm here, it still gets a real chance to compile
      // on its first test hit (same as before this fix existed) -- log and move on rather than
      // failing the whole suite over a warmup-only request.
      console.warn(`[global-setup] warmup request failed for ${route}:`, error);
    }
  }
}
