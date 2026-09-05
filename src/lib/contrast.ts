/**
 * WCAG 2.x contrast ratio (brief W-8, entregable W8-3a, CU-W8-4): a pure implementation of the
 * relative-luminance + contrast-ratio formulas from the spec
 * (https://www.w3.org/TR/WCAG21/#dfn-relative-luminance,
 * https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio), used to measure this site's actual design-token
 * color pairs (`tokens.css`) instead of eyeballing them. `contrastPairTable.ts`-style ratchet is
 * intentionally NOT a hard-failing test for every pair: CLAUDE.md's rule for this brief is "si un par
 * baja de 4.5:1, no cambies el token: registra la desviación" -- a token change is a design decision
 * for the visual pass, not something a ratchet should force silently. What IS tested here is that the
 * FORMULA itself is correct (verified against known reference ratios), and the actual token ratios are
 * reported as data in `contrast.test.ts` / the task report table.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** Parses a `#rrggbb` (or `#rgb`) hex color into 0-255 RGB channels. Throws on malformed input. */
export function hexToRgb(hex: string): Rgb {
  const normalized = hex.replace(/^#/, '');
  const full =
    normalized.length === 3
      ? normalized
          .split('')
          .map((ch) => ch + ch)
          .join('')
      : normalized;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    throw new Error(`hexToRgb: not a valid hex color: "${hex}"`);
  }
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

/** One channel (0-255) converted to its linear-light value per the WCAG relative-luminance formula. */
function linearizeChannel(channel255: number): number {
  const c = channel255 / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance (0=black, 1=white) of an RGB color. */
export function relativeLuminance({ r, g, b }: Rgb): number {
  return 0.2126 * linearizeChannel(r) + 0.7152 * linearizeChannel(g) + 0.0722 * linearizeChannel(b);
}

/**
 * WCAG contrast ratio between two colors, in the range [1, 21]. Order of the two colors does not
 * matter -- the formula always divides the lighter luminance by the darker one.
 */
export function contrastRatio(hexA: string, hexB: string): number {
  const lumA = relativeLuminance(hexToRgb(hexA));
  const lumB = relativeLuminance(hexToRgb(hexB));
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

/** `true` when `ratio` clears AA for normal-size text (4.5:1) or, if `largeText`, AA-large (3:1). */
export function meetsAA(ratio: number, largeText = false): boolean {
  return ratio >= (largeText ? 3 : 4.5);
}
