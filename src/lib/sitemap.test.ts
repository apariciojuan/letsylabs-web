import { describe, expect, it } from 'vitest';
import { buildSitemapXml } from './sitemap';
import { SITE_PATHS } from './site-routes';
import { locales } from '../i18n';

const ORIGIN = 'https://letsylabs.com';

describe('buildSitemapXml', () => {
  const xml = buildSitemapXml(ORIGIN);

  it('is well-formed XML with the sitemap and xhtml namespaces', () => {
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
  });

  it('has one <url> entry per (page, locale) pair', () => {
    const urlCount = (xml.match(/<url>/g) ?? []).length;
    expect(urlCount).toBe(SITE_PATHS.length * locales.length);
  });

  it('every <loc> is an absolute https URL under the given origin', () => {
    const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
    expect(locs.length).toBe(SITE_PATHS.length * locales.length);
    for (const loc of locs) {
      expect(loc.startsWith(`${ORIGIN}/`)).toBe(true);
    }
  });

  it('the home page entry carries all 3 hreflang alternates (en, es, x-default)', () => {
    const homeBlockMatch = xml.match(
      /<url>\s*<loc>https:\/\/letsylabs\.com\/<\/loc>[\s\S]*?<\/url>/,
    );
    expect(homeBlockMatch).not.toBeNull();
    const block = homeBlockMatch?.[0] ?? '';
    expect(block).toContain('hreflang="en"');
    expect(block).toContain('hreflang="es"');
    expect(block).toContain('hreflang="x-default"');
    expect(block).toContain('href="https://letsylabs.com/es/"');
  });

  it('includes the Spanish self-host URL with its EN alternate', () => {
    expect(xml).toContain('<loc>https://letsylabs.com/es/self-host</loc>');
    expect(xml).toContain('href="https://letsylabs.com/self-host"');
  });
});
