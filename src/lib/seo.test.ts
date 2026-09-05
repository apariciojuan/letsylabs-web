import { describe, expect, it } from 'vitest';
import {
  alternatesFor,
  canonicalFor,
  ogImageFor,
  ogImagePathFor,
  ogLocaleFor,
  ogSlugFor,
  siteOrigin,
} from './seo';

const ORIGIN = 'https://letsylabs.com';

describe('siteOrigin', () => {
  it('strips a trailing slash from a URL object', () => {
    expect(siteOrigin(new URL('https://letsylabs.com/'))).toBe('https://letsylabs.com');
  });

  it('strips a trailing slash from a plain string', () => {
    expect(siteOrigin('https://letsylabs.com/')).toBe('https://letsylabs.com');
  });

  it('leaves an origin with no trailing slash unchanged', () => {
    expect(siteOrigin('https://letsylabs.com')).toBe('https://letsylabs.com');
  });

  it('falls back to the documented default origin when site is undefined (test-container safety net)', () => {
    expect(siteOrigin(undefined)).toBe('https://letsylabs.com');
  });
});

describe('canonicalFor', () => {
  it('joins the origin and the exact current pathname', () => {
    expect(canonicalFor('/voice', ORIGIN)).toBe('https://letsylabs.com/voice');
  });

  it('preserves an already locale-prefixed pathname as-is', () => {
    expect(canonicalFor('/es/voice', ORIGIN)).toBe('https://letsylabs.com/es/voice');
  });

  it('handles the home page', () => {
    expect(canonicalFor('/', ORIGIN)).toBe('https://letsylabs.com/');
  });
});

describe('alternatesFor', () => {
  it('returns absolute en/es/x-default URLs for a bare English pathname', () => {
    expect(alternatesFor('/voice', ORIGIN)).toEqual({
      en: 'https://letsylabs.com/voice',
      es: 'https://letsylabs.com/es/voice',
      'x-default': 'https://letsylabs.com/voice',
    });
  });

  it('returns the same alternates when given the Spanish-prefixed pathname instead', () => {
    expect(alternatesFor('/es/voice', ORIGIN)).toEqual({
      en: 'https://letsylabs.com/voice',
      es: 'https://letsylabs.com/es/voice',
      'x-default': 'https://letsylabs.com/voice',
    });
  });

  it('handles the home page (Spanish home is /es/, not /es)', () => {
    expect(alternatesFor('/', ORIGIN)).toEqual({
      en: 'https://letsylabs.com/',
      es: 'https://letsylabs.com/es/',
      'x-default': 'https://letsylabs.com/',
    });
  });
});

describe('ogSlugFor', () => {
  it('slugs the home page to "home"', () => {
    expect(ogSlugFor('/')).toBe('home');
    expect(ogSlugFor('/es/')).toBe('home');
  });

  it('slugs a bare pathname to itself without the leading slash', () => {
    expect(ogSlugFor('/self-host')).toBe('self-host');
  });

  it('strips the /es/ prefix before slugging', () => {
    expect(ogSlugFor('/es/self-host')).toBe('self-host');
  });

  // Bug found while inspecting a real build (brief W-8): Astro's directory build format resolves
  // `Astro.url.pathname` for a page like `src/pages/company.astro` to `/company/` (trailing slash),
  // NOT the bare `/company` this module's other tests assume -- BaseLayout.astro passes exactly that
  // value through to `ogImageFor`. Before this fix, a trailing slash survived the leading-slash
  // strip and got its OWN dash from `replace(/\//g, '-')`, producing 'company-' (a slug ending in a
  // dash) and therefore a doubled-dash filename ('company--en.png') that never matched the file
  // `scripts/og/render.mjs` actually wrote ('company-en.png') -- caught by `check_og.mjs` against a
  // real `pnpm build` output.
  it('strips a trailing slash from a real Astro.url.pathname (regression)', () => {
    expect(ogSlugFor('/company/')).toBe('company');
    expect(ogSlugFor('/es/company/')).toBe('company');
  });
});

describe('ogImageFor / ogImagePathFor', () => {
  it('builds the absolute OG image URL per locale', () => {
    expect(ogImageFor('/voice', 'en', ORIGIN)).toBe('https://letsylabs.com/og/voice-en.png');
    expect(ogImageFor('/es/voice', 'es', ORIGIN)).toBe('https://letsylabs.com/og/voice-es.png');
  });

  it('builds the site-relative OG image path (no origin)', () => {
    expect(ogImagePathFor('/', 'en')).toBe('/og/home-en.png');
    expect(ogImagePathFor('/pricing', 'es')).toBe('/og/pricing-es.png');
  });
});

describe('ogLocaleFor', () => {
  it('maps en -> en_US and es -> es_ES', () => {
    expect(ogLocaleFor('en')).toBe('en_US');
    expect(ogLocaleFor('es')).toBe('es_ES');
  });
});
