#!/usr/bin/env node
/**
 * Ratchet (brief W-7, hardened W-7b, spec D-W7-4): after `pnpm build`, `dist/_headers` must exist
 * and contain every mandatory directive from the policy `scripts/security-headers.mjs` writes, and
 * every inline `<script>` (one with no `src` attribute) in any `dist/**\/*.html` file must have its
 * exact `sha256-<base64>` hash present in `_headers`' `script-src` directive -- D-W7-4's
 * `script-src 'self'` is strict, so a shipped inline script with no matching hash would be silently
 * no-op'd by any real browser's CSP enforcement while looking fine in a build that never checks for
 * it. Run as `pnpm headers:check` (== `node scripts/check_headers.mjs`). Same shape as
 * `scripts/check_placeholders.mjs`: logic exported for `scripts/check_headers.test.mjs`, `main()`
 * walks the real `dist/` tree.
 *
 * W-7b hardening: this used to special-case Astro's own two core inline scripts (the
 * client-hydration bootstrap and the `<astro-island>` custom element definition) by regex
 * fingerprint, letting them through with NO hash in `_headers` at all -- which a real browser would
 * still have blocked (§6.5: the determinism check was weakened to pass instead of the underlying
 * fact being fixed). The real guarantee is the hash, not the script's origin: this file no longer
 * has ANY exception. `security-headers.mjs` computes and writes the hashes; this file recomputes
 * them from the built HTML (via the shared `csp_hash.mjs`) and verifies each one made it into
 * `_headers`. No script in this repo should be inline in the first place (every author-written
 * script is forced external by `astro.config.mjs`'s `assetsInlineLimit: 0`) -- Astro's own core
 * runtime scripts are the sole reason any inline `<script>` ships at all.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { findInlineScripts, hashInlineScript } from './csp_hash.mjs';

// Every directive/value `scripts/security-headers.mjs`'s `buildHeaders()` always writes, regardless
// of whether an endpoint is configured (the endpoint-derived origin in connect-src/form-action is
// NOT checked here -- it varies per build, checked instead by security-headers.test.mjs).
const REQUIRED_HEADER_FRAGMENTS = [
  'Content-Security-Policy:',
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  'upgrade-insecure-requests',
  'Strict-Transport-Security: max-age=63072000; includeSubDomains; preload',
  'X-Content-Type-Options: nosniff',
  'X-Frame-Options: DENY',
  'Referrer-Policy: strict-origin-when-cross-origin',
  'Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()',
];

/** Returns the required fragments NOT found in `headersContent` (empty array = OK). */
export function findMissingHeaderDirectives(headersContent) {
  return REQUIRED_HEADER_FRAGMENTS.filter((fragment) => !headersContent.includes(fragment));
}

/**
 * Every source expression (`'self'`, `'sha256-...'`, ...) listed in `headersContent`'s script-src
 * directive. Returns `[]` when the directive is absent.
 * @param {string} headersContent
 * @returns {string[]}
 */
export function extractScriptSrcSources(headersContent) {
  const match = /script-src([^;\n]*)/.exec(headersContent);
  if (!match) return [];
  return match[1].trim().split(/\s+/).filter(Boolean);
}

/**
 * Every inline (no `src`) `<script>` element in `html` whose exact sha256 hash is NOT present in
 * `headersContent`'s script-src directive -- these are the ones a browser under D-W7-4's
 * `script-src 'self'` (+ hashes) policy would silently refuse to execute. No exception for Astro's
 * own core scripts (W-7b): every inline script, regardless of where it came from, must clear this
 * same check.
 * @param {string} html
 * @param {string} headersContent
 * @returns {string[]}
 */
export function findUnhashedInlineScripts(html, headersContent) {
  const allowedHashes = new Set(
    extractScriptSrcSources(headersContent)
      .filter((source) => source.startsWith("'sha256-"))
      .map((source) => source.slice(1, -1)),
  );
  return findInlineScripts(html)
    .filter(({ body }) => !allowedHashes.has(hashInlineScript(body)))
    .map(({ tag, body }) => `${tag} (no '${hashInlineScript(body)}' in script-src)`);
}

function listHtmlFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listHtmlFiles(fullPath);
    if (entry.isFile() && entry.name.endsWith('.html')) return [fullPath];
    return [];
  });
}

function main() {
  const distDir = process.argv[2] ?? 'dist';
  const resolvedDist = path.resolve(distDir);

  let stat;
  try {
    stat = statSync(resolvedDist);
  } catch {
    console.log(`check_headers: '${distDir}' does not exist yet -- nothing to check.`);
    return;
  }
  if (!stat.isDirectory()) {
    console.log(`check_headers: '${distDir}' is not a directory -- nothing to check.`);
    return;
  }

  const problems = [];

  const headersPath = path.join(resolvedDist, '_headers');
  let headersContent;
  try {
    headersContent = readFileSync(headersPath, 'utf8');
  } catch {
    problems.push(`'${distDir}/_headers' is missing -- did the security-headers integration run?`);
  }
  if (headersContent !== undefined) {
    const missing = findMissingHeaderDirectives(headersContent);
    if (missing.length > 0) {
      problems.push(`'${distDir}/_headers' is missing directive(s): ${missing.join(', ')}`);
    }
  }

  const htmlFiles = listHtmlFiles(resolvedDist);
  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf8');
    const unhashed = findUnhashedInlineScripts(html, headersContent ?? '');
    if (unhashed.length > 0) {
      problems.push(
        `${path.relative(resolvedDist, file)}: inline <script> tag(s) violate script-src 'self' (no matching hash): ${unhashed.join(', ')}`,
      );
    }
  }

  if (problems.length > 0) {
    console.error(`check_headers: FAILED in ${distDir}:`);
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `check_headers: OK -- '${distDir}/_headers' has every mandatory directive, and every inline <script> in ${htmlFiles.length} HTML file(s) has its sha256 hash in script-src.`,
  );
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main();
}
