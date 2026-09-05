/**
 * Pure SEO metadata helpers (brief W-8, entregable W8-1a): absolute canonical URL, absolute hreflang
 * alternates (en/es/x-default) and the OG image URL for a given page, all built from the same
 * `PUBLIC_SITE_URL`-derived origin (`astro.config.mjs`'s `site`, read via `Astro.site` in
 * `BaseLayout.astro`) so none of the three can point at a different domain by accident.
 *
 * Deliberately framework-agnostic (no `Astro.*` reads in here): every function takes its inputs as
 * plain arguments so this module is unit-testable without mounting a page, and reusable from
 * `src/pages/sitemap.xml.ts` (also needs canonical/alternate URLs, no `<head>` involved at all).
 */
// Explicit `.ts`/`index.ts` extensions (unlike the rest of this repo's extensionless `'../i18n'`
// imports): this module is also imported directly by plain-`node`-executed ratchets
// (`scripts/check_seo.mjs`, `scripts/check_og.mjs`, `scripts/check_a11y.mjs`), which -- unlike
// Vite/Astro's bundler resolution -- require an exact, extension-complete specifier for a relative
// import (no directory-index or extensionless resolution). Astro's `moduleResolution: "bundler"`
// (astro/tsconfigs/strict) accepts explicit extensions just as well, so this does not change how the
// app itself builds.
import { locales, defaultLocale, type Locale } from '../i18n/index.ts';
import { localizePath, stripLocalePrefix } from '../i18n/routing.ts';

/** hreflang value for Astro's own locale plus the one extra 'x-default' entry. */
export type HreflangCode = Locale | 'x-default';

/**
 * Matches `astro.config.mjs`'s own fallback (and `.env.example`'s documented default): the
 * provisional origin until the real domain (workspace 🔴) is confirmed. Real builds always set
 * `Astro.site` (astro.config.mjs's `site` option never leaves it undefined), so this constant only
 * ever matters as the safety net described on `siteOrigin` below.
 */
export const DEFAULT_SITE_ORIGIN = 'https://letsylabs.com';

/**
 * Normalizes an `Astro.site` URL (or a raw `PUBLIC_SITE_URL` string) to an origin with no trailing
 * slash, e.g. `new URL('https://letsylabs.com/')` -> `'https://letsylabs.com'`. Falls back to
 * `DEFAULT_SITE_ORIGIN` when `site` is undefined -- real builds never hit this branch (`site` is
 * always set, see above); it exists so component tests that render `BaseLayout.astro` through
 * `astro/container` (which does not load `astro.config.mjs`'s `site` option, see
 * `src/test/render-astro.ts`) get a stable, valid absolute URL instead of every SEO test needing to
 * fake `Astro.site`.
 */
export function siteOrigin(site: URL | string | undefined): string {
  return (site ?? DEFAULT_SITE_ORIGIN).toString().replace(/\/+$/, '');
}

/** The absolute canonical URL for the CURRENT page's exact pathname (already locale-prefixed). */
export function canonicalFor(pathname: string, origin: string): string {
  return `${origin}${pathname}`;
}

/**
 * The absolute URL of `pathname`'s equivalent in every supported locale, plus `x-default` (pointing
 * at the default-locale/English version, matching search engines' convention for a
 * language-negotiated root). Accepts `pathname` in EITHER form (bare or already locale-prefixed) --
 * `stripLocalePrefix` normalizes it first, same as `BaseLayout.astro`'s existing (relative) hreflang
 * logic did before this module replaced it.
 */
export function alternatesFor(pathname: string, origin: string): Record<HreflangCode, string> {
  const bare = stripLocalePrefix(pathname);
  const result = {} as Record<HreflangCode, string>;
  for (const locale of locales) {
    result[locale] = `${origin}${localizePath(bare, locale)}`;
  }
  result['x-default'] = `${origin}${localizePath(bare, defaultLocale)}`;
  return result;
}

/**
 * The URL-safe slug for a page's OG image filename: '/' -> 'home', '/self-host' -> 'self-host',
 * '/es/self-host' -> 'self-host' (locale is a SEPARATE suffix, see `ogImageFor`). Every remaining `/`
 * (there are none today -- no nested routes -- but kept for robustness) becomes '-'.
 *
 * A trailing slash is stripped BEFORE that '/' -> '-' conversion (regression, seo.test.ts): Astro's
 * directory build format resolves `Astro.url.pathname` for e.g. `src/pages/company.astro` to
 * `/company/`, not the bare `/company` every other caller in this repo uses -- without stripping it
 * first, the trailing slash got its own dash, producing a slug ending in '-' ('company-') and a
 * doubled-dash filename that never matched the one `scripts/og/render.mjs` actually writes.
 */
export function ogSlugFor(pathname: string): string {
  const bare = stripLocalePrefix(pathname);
  if (bare === '/') return 'home';
  return bare.replace(/^\//, '').replace(/\/$/, '').replace(/\//g, '-');
}

/** The absolute URL of the pre-rendered OG image for `pathname` in `locale` (see scripts/og/render.mjs). */
export function ogImageFor(pathname: string, locale: Locale, origin: string): string {
  return `${origin}/og/${ogSlugFor(pathname)}-${locale}.png`;
}

/** The public/dist-relative path (no origin) of the same OG image, for filesystem existence checks. */
export function ogImagePathFor(pathname: string, locale: Locale): string {
  return `/og/${ogSlugFor(pathname)}-${locale}.png`;
}

/**
 * Open Graph's `og:locale` value (language_TERRITORY, underscore-separated -- the format the OG
 * protocol itself uses, e.g. Facebook's own docs: "en_US", "es_ES"). No territory selector exists in
 * this repo's i18n (just 'en'/'es'), so this picks the single most common territory per language
 * rather than adding a whole new axis of configuration for a value only crawlers read.
 */
export function ogLocaleFor(locale: Locale): string {
  return locale === 'es' ? 'es_ES' : 'en_US';
}
