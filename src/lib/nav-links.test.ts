import { describe, expect, it } from 'vitest';
import { ctaLabelKey, navSectionFor, ROUTES } from './nav-links';

describe('navSectionFor', () => {
  it('classifies every Product page as "product"', () => {
    expect(navSectionFor(ROUTES.voice)).toBe('product');
    expect(navSectionFor(ROUTES.telephony)).toBe('product');
    expect(navSectionFor(ROUTES.compliance)).toBe('product');
    expect(navSectionFor(ROUTES.selfHost)).toBe('product');
  });

  it('classifies /open-source as "developers"', () => {
    expect(navSectionFor(ROUTES.openSource)).toBe('developers');
  });

  it('classifies /pricing and /company', () => {
    expect(navSectionFor(ROUTES.pricing)).toBe('pricing');
    expect(navSectionFor(ROUTES.company)).toBe('company');
  });

  it('returns null for the homepage and for unknown paths (error/edge path, not just the happy path)', () => {
    expect(navSectionFor('/')).toBeNull();
    expect(navSectionFor('/nonexistent')).toBeNull();
  });
});

describe('ctaLabelKey', () => {
  it('defaults to the pre-GA label ("Get early access")', () => {
    expect(ctaLabelKey(false)).toBe('nav.ctaPreGa');
  });

  it('switches to the post-GA label ("Start building") once launched', () => {
    expect(ctaLabelKey(true)).toBe('nav.ctaPostGa');
  });
});
