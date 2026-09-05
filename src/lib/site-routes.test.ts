import { describe, expect, it } from 'vitest';
import en from '../i18n/en.json';
import es from '../i18n/es.json';
import { SITE_PATHS, SITE_ROUTES } from './site-routes';

describe('SITE_ROUTES', () => {
  it('lists exactly the 10 real pages under src/pages/ (home + the 9 named routes)', () => {
    expect(SITE_ROUTES.map((route) => route.path)).toEqual([
      '/',
      '/voice',
      '/telephony',
      '/compliance',
      '/self-host',
      '/open-source',
      '/pricing',
      '/company',
      '/privacy',
      '/terms',
    ]);
  });

  it('every metaPrefix resolves to a non-empty meta.title/meta.description in BOTH catalogs', () => {
    for (const { metaPrefix } of SITE_ROUTES) {
      const enSection = (en as Record<string, { meta?: { title?: string; description?: string } }>)[
        metaPrefix
      ];
      const esSection = (es as Record<string, { meta?: { title?: string; description?: string } }>)[
        metaPrefix
      ];
      expect(enSection?.meta?.title, `en.${metaPrefix}.meta.title`).toBeTruthy();
      expect(enSection?.meta?.description, `en.${metaPrefix}.meta.description`).toBeTruthy();
      expect(esSection?.meta?.title, `es.${metaPrefix}.meta.title`).toBeTruthy();
      expect(esSection?.meta?.description, `es.${metaPrefix}.meta.description`).toBeTruthy();
    }
  });
});

describe('SITE_PATHS', () => {
  it('is the plain list of pathnames, same order as SITE_ROUTES', () => {
    expect(SITE_PATHS).toEqual(SITE_ROUTES.map((route) => route.path));
  });
});
