import type { Locale } from './index';
// Explicit `.ts` extension: same plain-`node` ratchet import chain as `src/lib/seo.ts` (see its comment).
import { stripBase, withBase } from '../lib/base.ts';

/**
 * Maps a pathname to its equivalent under `target` locale, matching the routing config in
 * astro.config.mjs (`defaultLocale: 'en'`, `locales: ['en', 'es']`,
 * `routing.prefixDefaultLocale: false`): English lives at the bare path, Spanish is prefixed with
 * `/es`. Shared by the language switcher and the `hreflang` alternates in BaseLayout so both always
 * agree on where "the same page in the other language" lives.
 *
 * Both accept a pathname with or without the deploy base (`src/lib/base.ts`): `stripLocalePrefix`
 * returns the bare, base-less route (what `ROUTES`/`SITE_PATHS` and active-link matching compare
 * against) and `localizePath` returns a ready-to-use `href`, base included.
 */
export function stripLocalePrefix(pathname: string): string {
  const bare = stripBase(pathname);
  if (bare === '/es') return '/';
  if (bare.startsWith('/es/')) return bare.slice('/es'.length);
  return bare;
}

export function localizePath(pathname: string, target: Locale): string {
  const bare = stripLocalePrefix(pathname);
  if (target === 'en') return withBase(bare);
  return withBase(bare === '/' ? '/es/' : `/es${bare}`);
}
