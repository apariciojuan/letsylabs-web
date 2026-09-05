/**
 * i18n catalog and typed `t()` helper.
 *
 * Native Astro i18n routing (see astro.config.mjs) puts English at `/` (defaultLocale, no prefix)
 * and Spanish at `/es/*` (routing.prefixDefaultLocale: false). This module only deals with the
 * translation catalog itself: `t(locale, key)` looks up a dot-path key in src/i18n/{en,es}.json,
 * typed against the shape of en.json so a typo in a key is a compile-time error.
 */
import en from './en.json';
import es from './es.json';

export type Locale = 'en' | 'es';

export const defaultLocale: Locale = 'en';
export const locales: readonly Locale[] = ['en', 'es'];

const catalogs = { en, es } as const satisfies Record<Locale, unknown>;

type Catalog = typeof en;

/** Recursively joins nested object keys into a dot-path union, e.g. "home.h1". */
type TranslationKey<T> = T extends string
  ? never
  : {
      [K in keyof T & string]: T[K] extends string ? K : `${K}.${TranslationKey<T[K]>}`;
    }[keyof T & string];

export type TranslationKeyOf<T = Catalog> = TranslationKey<T>;

function readPath(source: unknown, key: string): unknown {
  return key.split('.').reduce<unknown>((acc, segment) => {
    if (acc !== null && typeof acc === 'object' && segment in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[segment];
    }
    return undefined;
  }, source);
}

/**
 * Looks up `key` (a dot-path into en.json's shape) in the given locale's catalog, falling back to
 * `defaultLocale` if the locale is missing the key. Throws if neither catalog has it — a missing
 * key should never reach production because `pnpm i18n:check` (scripts/i18n_check.mjs) fails the
 * build first when en.json and es.json fall out of parity.
 */
export function t(locale: Locale, key: TranslationKeyOf): string {
  const direct = readPath(catalogs[locale], key);
  if (typeof direct === 'string') return direct;

  const fallback = readPath(catalogs[defaultLocale], key);
  if (typeof fallback === 'string') return fallback;

  throw new Error(
    `i18n: missing key "${key}" for locale "${locale}" (and for default locale "${defaultLocale}")`,
  );
}
