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

/**
 * Every inline (no `src` attribute) `<script>` element found in `html`, in document order, as
 * `{ tag, body }` -- `tag` is the opening tag text (for error reporting), `body` its exact raw
 * content (for hashing). A `<script src="...">` is external -- not subject to `script-src`'s hash
 * allowlist at all -- so it is never returned here. The single shared parser: both
 * `findInlineScriptBodies` below and `check_headers.mjs`'s `findUnhashedInlineScripts` build on
 * this instead of each re-declaring the `<script>`-matching regex.
 * @param {string} html
 * @returns {{ tag: string, body: string }[]}
 */
export function findInlineScripts(html) {
  const scripts = [];
  let match;
  while ((match = SCRIPT_ELEMENT_PATTERN.exec(html)) !== null) {
    const [fullElement, attrs, body] = match;
    if (/\bsrc\s*=/.test(attrs)) continue; // has a src -- external, not inline
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
