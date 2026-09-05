// @ts-check
/**
 * Shared pure utilities (brief W-7b, D-W7-4): computing the CSP `'sha256-<base64>'` source
 * expression for an inline `<script>` element's exact body text, per the CSP3 spec
 * (https://www.w3.org/TR/CSP3/#external-hash -- the hash is over the script element's raw text
 * content, UTF-8, unmodified: no trimming, no re-encoding).
 *
 * Used by BOTH `security-headers.mjs` (writes the hashes it computes into `dist/_headers`'s
 * `script-src`) and `check_headers.mjs` (recomputes the same hashes from the built HTML and
 * verifies each one is present in `_headers`) so the two never drift out of sync (CLAUDE.md §8.3,
 * DRY): one inline script, one hash function, one truth.
 */
import { createHash } from 'node:crypto';

// Matches a whole <script ...>...</script> element (open tag, body, close tag). Non-greedy body so
// it stops at the first close tag; every <script> element this repo's own build ever emits is a
// single, non-nested element.
const SCRIPT_ELEMENT_PATTERN = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;

// Per the HTML Standard's "prepare the script element" algorithm and CSP3
// (https://www.w3.org/TR/CSP3/#directive-script-src, "Is element nonceable?"/script-like
// definition), a <script> element is only EVER treated as an executable script -- and therefore
// only ever subject to `script-src`'s allowlist -- when its `type` attribute is absent, empty, or a
// JavaScript MIME type essence match (or "module"). A `type` naming anything else (a data block --
// `application/ld+json`, `application/json`, `text/template`...) makes the element inert: browsers
// never execute it, so `script-src` categorically does not apply to it, with or without a hash. This
// is exactly why JSON-LD structured data (brief W-8, `src/lib/schema.ts`) does not need
// `'unsafe-inline'`, a nonce, or a hash under a strict `script-src 'self'` policy -- treating it as
// "just another inline script" here would be checking a rule that plainly does not govern it.
const JS_MIME_TYPES = new Set([
  '',
  'text/javascript',
  'application/javascript',
  'application/ecmascript',
  'application/x-ecmascript',
  'application/x-javascript',
  'text/ecmascript',
  'text/javascript1.0',
  'text/javascript1.1',
  'text/javascript1.2',
  'text/javascript1.3',
  'text/javascript1.4',
  'text/javascript1.5',
  'text/jscript',
  'text/livescript',
  'text/x-ecmascript',
  'text/x-javascript',
  'module',
]);

/**
 * `true` when a `<script>` element with these opening-tag attributes is subject to `script-src` at
 * all -- i.e. whether a real browser would ever try to execute it as code (see the constant above).
 * @param {string} attrs
 * @returns {boolean}
 */
function isScriptSrcGoverned(attrs) {
  const match = /\btype\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))/i.exec(attrs);
  if (!match) return true; // no type attribute -- defaults to JavaScript
  const type = (match[1] ?? match[2] ?? match[3] ?? '').trim().toLowerCase();
  return JS_MIME_TYPES.has(type);
}

/**
 * Every inline (no `src` attribute) `<script>` element found in `html` THAT `script-src` ACTUALLY
 * GOVERNS (see `isScriptSrcGoverned`), in document order, as `{ tag, body }` -- `tag` is the opening
 * tag text (for error reporting), `body` its exact raw content (for hashing). A `<script src="...">`
 * is external -- not subject to `script-src`'s hash allowlist at all -- so it is never returned here,
 * and neither is a non-JS-type data block like `<script type="application/ld+json">` (W-8): CSP does
 * not apply to it, so it needs no hash. The single shared parser: both `findInlineScriptBodies` below
 * and `check_headers.mjs`'s `findUnhashedInlineScripts` build on this instead of each re-declaring
 * the `<script>`-matching regex.
 * @param {string} html
 * @returns {{ tag: string, body: string }[]}
 */
export function findInlineScripts(html) {
  const scripts = [];
  let match;
  while ((match = SCRIPT_ELEMENT_PATTERN.exec(html)) !== null) {
    const [fullElement, attrs, body] = match;
    if (/\bsrc\s*=/.test(attrs)) continue; // has a src -- external, not inline
    if (!isScriptSrcGoverned(attrs)) continue; // not a JS-executable type -- CSP does not apply
    scripts.push({ tag: fullElement.slice(0, fullElement.indexOf('>') + 1), body });
  }
  return scripts;
}

/**
 * Every inline (no `src` attribute) `<script>` element's raw body text found in `html`, in
 * document order. A `<script src="...">` is external -- not subject to `script-src`'s hash
 * allowlist at all -- so it is never returned here.
 * @param {string} html
 * @returns {string[]}
 */
export function findInlineScriptBodies(html) {
  return findInlineScripts(html).map(({ body }) => body);
}

/**
 * The CSP `'sha256-<base64>'` source expression for an inline script's exact body text.
 * @param {string} body
 * @returns {string}
 */
export function hashInlineScript(body) {
  return `sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}`;
}
