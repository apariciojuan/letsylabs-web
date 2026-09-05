/**
 * Single source of truth for "every real page this site ships" (brief W-8): sitemap.xml, robots.txt
 * and the e2e no-overflow sweep all derive their route list from here instead of each maintaining
 * their own copy that can silently drift out of sync with the actual `src/pages/` tree.
 *
 * English-canonical (unprefixed) pathnames, same shape as `ROUTES` in `src/lib/nav-links.ts` (which
 * this module reuses rather than duplicating) plus the home page ('/'), which `ROUTES` deliberately
 * omits (SiteNav/SiteFooter never link to a route object for the logo -- see nav-links.ts). Each
 * entry also carries the i18n key prefix used for that page's `<title>`/`<meta description>` (every
 * page's meta lives at `<prefix>.meta.title` / `<prefix>.meta.description` in src/i18n/{en,es}.json,
 * confirmed against every src/pages/*.astro file) so `src/lib/seo.ts` and the dist-scanning ratchets
 * can look titles/descriptions up without a second hand-written table.
 *
 * `src/pages/dev/components.astro` (dev-only QA harness, stripped from `dist/` at build,
 * `astro.config.mjs`'s `stripDevPages`) is deliberately NOT listed here -- it is not a real page.
 */
export interface SiteRoute {
  /** English-canonical (unprefixed) pathname, e.g. '/voice'. */
  path: string;
  /** i18n key prefix: `${metaPrefix}.meta.title` / `${metaPrefix}.meta.description`. */
  metaPrefix: string;
}

export const SITE_ROUTES: readonly SiteRoute[] = [
  { path: '/', metaPrefix: 'home' },
  { path: '/voice', metaPrefix: 'voice' },
  { path: '/telephony', metaPrefix: 'telephony' },
  { path: '/compliance', metaPrefix: 'compliance' },
  { path: '/self-host', metaPrefix: 'selfHost' },
  { path: '/open-source', metaPrefix: 'openSource' },
  { path: '/pricing', metaPrefix: 'pricing' },
  { path: '/company', metaPrefix: 'company' },
  { path: '/privacy', metaPrefix: 'privacy' },
  { path: '/terms', metaPrefix: 'terms' },
] as const;

/** English-canonical pathnames only, e.g. for building both-locale URL pairs. */
export const SITE_PATHS: readonly string[] = SITE_ROUTES.map((route) => route.path);
