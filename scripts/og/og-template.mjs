// @ts-check
/**
 * Pure SVG builder for OG images (brief W-8, entregable W8-1b): the pulse motif (README §1.1: "un
 * pulso de señal abstracto — tres nodos conectados por una línea", favicon/OG asset note in the same
 * section) at 1200x630 (the standard `og:image` size), `bg` background, the wordmark, and the page's
 * own title. No Playwright/browser API here at all -- this module only builds a string, so it is
 * unit-testable on its own; `scripts/og/render.mjs` is the (browser-requiring, untested-by-unit-tests)
 * layer that turns this string into a PNG.
 *
 * The title is rendered inside a `<foreignObject>` HTML `<div>` rather than SVG `<text>` because SVG
 * text does not wrap -- a `<div>` with `line-height`/`max-width` lets a long page title wrap onto
 * multiple lines exactly like real body copy would, which plain `<text>` cannot do without manually
 * splitting into `<tspan>` lines.
 */

const BG = '#07090D';
const INK = '#E8EDF2';
const SIGNAL = '#4AF2A1';
const LINE = 'rgba(255,255,255,0.25)';

/**
 * Escapes the 5 characters that are unsafe inside SVG/XHTML text content or attribute values.
 * @param {string} value
 * @returns {string}
 */
export function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * The pulse motif (three `signal`-green nodes joined by a translucent line), scaled up from
 * `Logo.astro`'s 38x8 header mark to a size legible at OG-image scale, plus the "letsylabs"
 * wordmark next to it. Static (no animation) -- unlike `Logo.astro`, an OG image is a single frame.
 * @param {number} x
 * @param {number} y
 */
function pulseMark(x, y) {
  return `
    <line x1="${x}" y1="${y}" x2="${x + 120}" y2="${y}" stroke="${LINE}" stroke-width="2" />
    <circle cx="${x}" cy="${y}" r="9" fill="${SIGNAL}" />
    <circle cx="${x + 60}" cy="${y}" r="9" fill="${SIGNAL}" />
    <circle cx="${x + 120}" cy="${y}" r="9" fill="${SIGNAL}" />
    <text x="${x + 148}" y="${y + 10}" font-family="'Space Grotesk', sans-serif" font-weight="600"
      font-size="34" letter-spacing="-0.5" fill="${INK}">letsylabs</text>`;
}

/**
 * Builds the full 1200x630 OG image SVG for a page titled `title`. `title` is untrusted only in the
 * sense that it is user-language i18n copy (never actual external input) -- escaped anyway as good
 * practice for anything landing inside markup.
 * @param {{ title: string }} params
 * @returns {string}
 */
export function ogSvg({ title }) {
  const safeTitle = escapeXml(title);
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${BG}" />
  ${pulseMark(80, 108)}
  <foreignObject x="80" y="220" width="1040" height="340">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:'Space Grotesk', sans-serif; font-weight:600; font-size:56px; line-height:1.18; letter-spacing:-1px; color:${INK}; margin:0;">${safeTitle}</div>
  </foreignObject>
</svg>`;
}

/**
 * Wraps `svg` in the minimal HTML document `scripts/og/render.mjs` loads into a headless Chromium
 * page: an exact 1200x630 canvas (no margin/scroll) plus a base64-embedded `@font-face` for Space
 * Grotesk 600 (`fontBase64`) so the render is deterministic regardless of whether the rendering
 * container happens to have any system font installed under that family name -- the OG PNG must look
 * the same in CI as on a developer's machine.
 * @param {string} svg
 * @param {string} fontBase64 base64-encoded Space Grotesk 600 TTF
 * @returns {string}
 */
export function ogHtmlDocument(svg, fontBase64) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      @font-face {
        font-family: 'Space Grotesk';
        font-weight: 600;
        src: url(data:font/ttf;base64,${fontBase64}) format('truetype');
      }
      html, body {
        margin: 0;
        padding: 0;
        width: 1200px;
        height: 630px;
        background: ${BG};
        overflow: hidden;
      }
    </style>
  </head>
  <body>${svg}</body>
</html>`;
}
