import { describe, expect, it } from 'vitest';
import { contrastRatio, hexToRgb, meetsAA, relativeLuminance } from './contrast';

describe('hexToRgb', () => {
  it('parses a 6-digit hex color', () => {
    expect(hexToRgb('#07090D')).toEqual({ r: 7, g: 9, b: 13 });
  });

  it('parses a 3-digit shorthand hex color', () => {
    expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('throws for a malformed hex color', () => {
    expect(() => hexToRgb('not-a-color')).toThrow(/not a valid hex color/);
  });
});

describe('relativeLuminance', () => {
  it('is 0 for black', () => {
    expect(relativeLuminance(hexToRgb('#000000'))).toBeCloseTo(0, 5);
  });

  it('is 1 for white', () => {
    expect(relativeLuminance(hexToRgb('#ffffff'))).toBeCloseTo(1, 5);
  });
});

describe('contrastRatio (formula correctness, verified against WCAG reference values)', () => {
  it('is 21:1 for black on white (the maximum possible ratio)', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
  });

  it('is 1:1 for a color against itself (the minimum possible ratio)', () => {
    expect(contrastRatio('#4af2a1', '#4af2a1')).toBeCloseTo(1, 5);
  });

  it('does not depend on argument order', () => {
    expect(contrastRatio('#07090D', '#8B96A5')).toBeCloseTo(contrastRatio('#8B96A5', '#07090D'), 5);
  });

  // Known reference pair: pure white text on pure black background is documented everywhere as
  // exactly 21:1; #767676 on white is WCAG's own oft-cited "just barely passes 4.5:1" example
  // (contrast ~4.54:1), used here as an external sanity check on the formula rather than a value
  // this repo invented.
  it('matches the well-known #767676-on-white ~4.5:1 reference point', () => {
    expect(contrastRatio('#767676', '#ffffff')).toBeCloseTo(4.54, 1);
  });
});

describe('meetsAA', () => {
  it('requires >=4.5:1 for normal text', () => {
    expect(meetsAA(4.5)).toBe(true);
    expect(meetsAA(4.49)).toBe(false);
  });

  it('requires only >=3:1 for large text', () => {
    expect(meetsAA(3, true)).toBe(true);
    expect(meetsAA(2.99, true)).toBe(false);
  });
});

/**
 * The actual design-token pairs the brief asks to verify (CU-W8-4). Ratios are ASSERTED (not just
 * logged) where they clear AA, and the ratio VALUE is what a report table cites -- but per the
 * brief's explicit instruction ("si algún par baja de 4.5:1 ... no cambies el token: registra la
 * desviación"), a pair that fails here would be reported as a finding, not silently made to pass by
 * editing this test to expect less.
 */
describe('letsylabs token contrast pairs (tokens.css, CU-W8-4)', () => {
  const BG = '#07090D';
  const SURFACE = '#0D1117';
  const MUTED = '#8B96A5';
  const INK = '#E8EDF2';
  const SIGNAL = '#4AF2A1';

  it('muted (#8B96A5) on bg (#07090D): AA for normal text (>=4.5:1)', () => {
    const ratio = contrastRatio(MUTED, BG);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
    expect(ratio).toBeCloseTo(6.62, 1); // documented in the task report's contrast table
  });

  it('muted (#8B96A5) on surface (#0D1117): AA for normal text (>=4.5:1)', () => {
    const ratio = contrastRatio(MUTED, SURFACE);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('ink (#E8EDF2) on bg (#07090D): comfortably AAA (>=7:1)', () => {
    expect(contrastRatio(INK, BG)).toBeGreaterThanOrEqual(7);
  });

  it('signal (#4AF2A1) on bg (#07090D): AA for normal text (>=4.5:1) -- used for links/focus rings', () => {
    const ratio = contrastRatio(SIGNAL, BG);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
