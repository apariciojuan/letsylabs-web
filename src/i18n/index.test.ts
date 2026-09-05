import { describe, expect, it } from 'vitest';
import en from './en.json';
import es from './es.json';
import { defaultLocale, locales, t, type TranslationKeyOf } from './index';

describe('t()', () => {
  it('returns the English string for a known key', () => {
    expect(t('en', 'home.h1')).toBe(en.home.h1);
  });

  it('returns the Spanish string for a known key', () => {
    expect(t('es', 'home.h1')).toBe(es.home.h1);
  });

  it('resolves nested keys (common.languageSwitch.en)', () => {
    expect(t('en', 'common.languageSwitch.en')).toBe('EN');
    expect(t('es', 'common.languageSwitch.es')).toBe('ES');
  });

  it('exposes en as the default locale and both locales in order', () => {
    expect(defaultLocale).toBe('en');
    expect(locales).toEqual(['en', 'es']);
  });

  it('throws for a key missing from both catalogs (error path, not the happy path)', () => {
    expect(() => t('es', 'nonexistent.key' as TranslationKeyOf)).toThrow(/missing key/i);
  });
});
