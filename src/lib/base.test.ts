import { afterEach, describe, expect, it, vi } from 'vitest';
import { normalizeBase, stripBase, withBase } from './base';

describe('normalizeBase', () => {
  it('treats a root/empty/undefined base as no prefix', () => {
    expect(normalizeBase(undefined)).toBe('');
    expect(normalizeBase('')).toBe('');
    expect(normalizeBase('/')).toBe('');
  });

  it('yields a leading slash and no trailing slash for a project base', () => {
    expect(normalizeBase('/letsylabs-web')).toBe('/letsylabs-web');
    expect(normalizeBase('/letsylabs-web/')).toBe('/letsylabs-web');
    expect(normalizeBase('letsylabs-web')).toBe('/letsylabs-web');
  });
});

describe('withBase / stripBase with an explicit base', () => {
  it('are the identity for a root deploy', () => {
    expect(withBase('/voice', '')).toBe('/voice');
    expect(stripBase('/voice', '')).toBe('/voice');
  });

  it('prefix and strip a project base, including the bare base itself', () => {
    expect(withBase('/', '/letsylabs-web')).toBe('/letsylabs-web/');
    expect(withBase('/es/voice', '/letsylabs-web')).toBe('/letsylabs-web/es/voice');
    expect(stripBase('/letsylabs-web', '/letsylabs-web')).toBe('/');
    expect(stripBase('/letsylabs-web/', '/letsylabs-web')).toBe('/');
    expect(stripBase('/letsylabs-web/es/voice/', '/letsylabs-web')).toBe('/es/voice/');
  });

  it('never strips a path that merely starts with the same characters', () => {
    expect(stripBase('/letsylabs-website/x', '/letsylabs-web')).toBe('/letsylabs-website/x');
  });
});

/**
 * Same helpers as the app sees them under a GitHub Pages project deploy (`base: '/letsylabs-web'`,
 * `import.meta.env.BASE_URL` set by Astro). The modules read the base at import time, so each test
 * resets the module registry and imports fresh after stubbing the env.
 */
describe('under a project base (import.meta.env.BASE_URL)', () => {
  const ORIGIN = 'https://apariciojuan.github.io';

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  async function load() {
    vi.stubEnv('BASE_URL', '/letsylabs-web');
    vi.resetModules();
    return {
      routing: await import('../i18n/routing'),
      seo: await import('./seo'),
      robots: await import('./robots'),
      sitemap: await import('./sitemap'),
    };
  }

  it('localizePath keeps the base in front of the locale prefix, both ways', async () => {
    const { routing } = await load();
    expect(routing.localizePath('/letsylabs-web/pricing/', 'es')).toBe(
      '/letsylabs-web/es/pricing/',
    );
    expect(routing.localizePath('/letsylabs-web/es/pricing/', 'en')).toBe(
      '/letsylabs-web/pricing/',
    );
    expect(routing.localizePath('/', 'es')).toBe('/letsylabs-web/es/');
    expect(routing.localizePath('/voice', 'en')).toBe('/letsylabs-web/voice');
  });

  it('stripLocalePrefix removes the base too, so active-link matching sees bare routes', async () => {
    const { routing } = await load();
    expect(routing.stripLocalePrefix('/letsylabs-web/es/voice')).toBe('/voice');
    expect(routing.stripLocalePrefix('/letsylabs-web/')).toBe('/');
  });

  it('hreflang alternates, OG image and sitemap/robots all carry the base', async () => {
    const { seo, robots, sitemap } = await load();
    expect(seo.alternatesFor('/letsylabs-web/pricing/', ORIGIN)).toEqual({
      en: `${ORIGIN}/letsylabs-web/pricing/`,
      es: `${ORIGIN}/letsylabs-web/es/pricing/`,
      'x-default': `${ORIGIN}/letsylabs-web/pricing/`,
    });
    expect(seo.ogImageFor('/letsylabs-web/es/pricing/', 'es', ORIGIN)).toBe(
      `${ORIGIN}/letsylabs-web/og/pricing-es.png`,
    );
    expect(seo.ogImagePathFor('/letsylabs-web/pricing/', 'en')).toBe('/og/pricing-en.png');
    expect(robots.buildRobotsTxt(ORIGIN)).toContain(`Sitemap: ${ORIGIN}/letsylabs-web/sitemap.xml`);
    expect(sitemap.buildSitemapXml(ORIGIN)).toContain(`<loc>${ORIGIN}/letsylabs-web/es/</loc>`);
  });
});
