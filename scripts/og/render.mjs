#!/usr/bin/env node
// @ts-check
/**
 * Renders one 1200x630 OG image PNG per (page, locale) pair into `public/og/` (brief W-8, entregable
 * W8-1b). Decision recorded in the brief: no new dependency for SVG->PNG conversion -- this reuses
 * the Chromium already installed in the `e2e` Playwright image (headless screenshot of the SVG built
 * by `scripts/og/og-template.mjs`) instead of adding an image-rendering library (`sharp`, `resvg`...)
 * to the whitelist. Must run under the `e2e` compose profile (`pnpm og:render`, see package.json) --
 * the `dev`/`web` services' plain `node:24-bookworm-slim` image has no browser binaries at all.
 *
 * `@playwright/test` is a devDependency of this repo, but its own public API is the TEST RUNNER, not
 * a general `chromium.launch()` entry point -- `playwright` (the browser-launching package) is only
 * a TRANSITIVE dependency of `@playwright/test`, so pnpm's strict node_modules layout does not expose
 * it at this script's own top-level import scope. Rather than adding `playwright`/`playwright-core`
 * as new direct dependencies (nothing else in this repo needs them), this resolves `playwright`
 * relative to `@playwright/test`'s own install location via `node:module`'s `createRequire` -- the
 * same "resolve as if you were that package" trick Node's own docs describe for reaching a
 * dependency's dependency, not a new package.
 *
 * The PNGs this writes are versioned assets (brief decision, `public/og/` is NOT gitignored) --
 * re-run `pnpm og:render` only when a page's title copy changes or a new page is added, not on every
 * build.
 */
import { createRequire } from 'node:module';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ogHtmlDocument, ogSvg } from './og-template.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..', '..');

/** Resolves the `playwright` package that ships as `@playwright/test`'s own dependency (see above). */
function loadChromiumLauncher() {
  const requireFromRepo = createRequire(path.join(repoRoot, 'package.json'));
  const testPkgPath = requireFromRepo.resolve('@playwright/test/package.json');
  const requireFromTest = createRequire(testPkgPath);
  return requireFromTest('playwright').chromium;
}

/** @returns {Promise<{ path: string, metaPrefix: string }[]>} */
async function loadSiteRoutes() {
  const mod = await import(path.join(repoRoot, 'src/lib/site-routes.ts'));
  return mod.SITE_ROUTES;
}

async function loadCatalogs() {
  const en = (await import(path.join(repoRoot, 'src/i18n/en.json'), { with: { type: 'json' } }))
    .default;
  const es = (await import(path.join(repoRoot, 'src/i18n/es.json'), { with: { type: 'json' } }))
    .default;
  return { en, es };
}

/**
 * OG image filename slug -- same rule as `src/lib/seo.ts`'s `ogSlugFor` (home -> 'home').
 * @param {string} pagePath
 * @returns {string}
 */
function slugFor(pagePath) {
  return pagePath === '/' ? 'home' : pagePath.replace(/^\//, '').replace(/\//g, '-');
}

async function main() {
  const [routes, catalogs, fontBuffer] = await Promise.all([
    loadSiteRoutes(),
    loadCatalogs(),
    readFile(path.join(repoRoot, 'public/fonts/space-grotesk-600.ttf')),
  ]);
  const fontBase64 = fontBuffer.toString('base64');

  const outDir = path.join(repoRoot, 'public/og');
  await mkdir(outDir, { recursive: true });

  const chromium = loadChromiumLauncher();
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
    for (const { path: pagePath, metaPrefix } of routes) {
      for (const [locale, catalog] of Object.entries(catalogs)) {
        const title = catalog[metaPrefix]?.meta?.title;
        if (!title) {
          throw new Error(`og:render: missing ${locale}.${metaPrefix}.meta.title`);
        }
        const svg = ogSvg({ title });
        const html = ogHtmlDocument(svg, fontBase64);
        await page.setContent(html, { waitUntil: 'load' });
        const outFile = path.join(outDir, `${slugFor(pagePath)}-${locale}.png`);
        await page.screenshot({ path: outFile, type: 'png' });
        console.log(`og:render: wrote ${path.relative(repoRoot, outFile)}`);
      }
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error('og:render: FAILED');
  console.error(error);
  process.exitCode = 1;
});
