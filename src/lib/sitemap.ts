/**
 * Pure sitemap.xml body builder (brief W-8, entregable W8-1a). Lives in `src/lib/` rather than
 * inline in `src/pages/sitemap.xml.ts` for one concrete reason: EVERY file under `src/pages/` is a
 * route to Astro, including `*.test.ts` -- a test file sitting next to the endpoint broke `astro
 * build` (`robots.txt.test`/`sitemap.xml.test` got treated as real routes and crashed rendering,
 * since they are Vitest suites, not `APIRoute` modules). Splitting the pure logic out here, with its
 * own `sitemap.test.ts` next to it (outside `src/pages/`), keeps the endpoint file itself a thin
 * `GET` wrapper with nothing Astro could mistake for a page.
 *
 * One `<url>` entry per (page, locale) pair, each carrying `<xhtml:link rel="alternate" hreflang>`
 * for BOTH locales (Google's documented multilingual-sitemap pattern:
 * https://developers.google.com/search/docs/specialty/international/localized-versions#sitemap) so a
 * crawler discovers the /es/* twin from the /* entry and vice versa without fetching both `<head>`s.
 * No new dependency (e.g. `@astrojs/sitemap`) -- this is a handful of lines of XML over a route list
 * this repo already owns (`src/lib/site-routes.ts`).
 */
import { alternatesFor, canonicalFor } from './seo.ts';
import { SITE_PATHS } from './site-routes.ts';
import { locales } from '../i18n/index.ts';
import { localizePath } from '../i18n/routing.ts';

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Builds the sitemap XML body for `origin`. */
export function buildSitemapXml(origin: string): string {
  const entries = SITE_PATHS.flatMap((path) =>
    locales.map((locale) => {
      const localePath = localizePath(path, locale);
      const loc = canonicalFor(localePath, origin);
      const alternates = alternatesFor(localePath, origin);
      const alternateLinks = [...locales, 'x-default' as const]
        .map(
          (code) =>
            `    <xhtml:link rel="alternate" hreflang="${code}" href="${escapeXml(alternates[code])}" />`,
        )
        .join('\n');
      return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n${alternateLinks}\n  </url>`;
    }),
  );

  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ' +
    'xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
    entries.join('\n') +
    '\n</urlset>\n'
  );
}
