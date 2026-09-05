import { describe, expect, it } from 'vitest';
import { localizePath, stripLocalePrefix } from './routing';

describe('stripLocalePrefix', () => {
  it('leaves English (unprefixed) paths untouched', () => {
    expect(stripLocalePrefix('/')).toBe('/');
    expect(stripLocalePrefix('/voice')).toBe('/voice');
  });

  it('strips the /es prefix, including the bare /es case', () => {
    expect(stripLocalePrefix('/es')).toBe('/');
    expect(stripLocalePrefix('/es/')).toBe('/');
    expect(stripLocalePrefix('/es/voice')).toBe('/voice');
  });
});

describe('localizePath', () => {
  it('maps the English home page to the Spanish home page and back', () => {
    expect(localizePath('/', 'es')).toBe('/es/');
    expect(localizePath('/es/', 'en')).toBe('/');
  });

  it('maps an interior page both ways', () => {
    expect(localizePath('/voice', 'es')).toBe('/es/voice');
    expect(localizePath('/es/voice', 'en')).toBe('/voice');
  });

  it('is idempotent when the target locale is already current', () => {
    expect(localizePath('/es/voice', 'es')).toBe('/es/voice');
    expect(localizePath('/voice', 'en')).toBe('/voice');
  });
});
