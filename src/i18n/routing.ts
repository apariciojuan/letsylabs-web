import type { Locale } from './index';

/**
 * Maps a pathname to its equivalent under `target` locale, matching the routing config in
 * astro.config.mjs (`defaultLocale: 'en'`, `locales: ['en', 'es']`,
 * `routing.prefixDefaultLocale: false`): English lives at the bare path, Spanish is prefixed with
 * `/es`. Shared by the language switcher and the `hreflang` alternates in BaseLayout so both always
 * agree on where "the same page in the other language" lives.
 */
export function stripLocalePrefix(pathname: string): string {
  if (pathname === '/es') return '/';
  if (pathname.startsWith('/es/')) return pathname.slice('/es'.length);
  return pathname;
}

export function localizePath(pathname: string, target: Locale): string {
  const bare = stripLocalePrefix(pathname);
  if (target === 'en') return bare;
  return bare === '/' ? '/es/' : `/es${bare}`;
}
