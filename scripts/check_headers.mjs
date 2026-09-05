#!/usr/bin/env node
/**
 * Ratchet (brief W-7, spec D-W7-4): after `pnpm build`, `dist/_headers` must exist and contain every
 * mandatory directive from the policy `scripts/security-headers.mjs` writes, and no
 * `dist/**\/*.html` file may ship an inline `<script>` (one with no `src` attribute) -- D-W7-4's
 * `script-src 'self'` is strict, so a shipped inline script would be silently no-op'd by any real
 * browser's CSP enforcement while looking fine in a build that never checks for it. Run as
 * `pnpm headers:check` (== `node scripts/check_headers.mjs`). Same shape as
 * `scripts/check_placeholders.mjs`: logic exported for `scripts/check_headers.test.mjs`, `main()`
 * walks the real `dist/` tree.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

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

// Matches a whole <script ...>...</script> element (open tag, body, close tag). Non-greedy body so
// it stops at the first close tag; every <script> element this repo's own build ever emits is a
// single, non-nested element.
const SCRIPT_ELEMENT_PATTERN = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;

// Astro's own core build ALWAYS emits two specific inline <script> elements on any page that
// hydrates a `client:*`-directive island (this repo's homepage has exactly one: `HomePage.astro`'s
// PipelineDiagramInteractive, `client:load`, brief W-3) -- there is no supported Astro/Vite option
// to externalize either (unlike every OTHER script in this repo, which astro.config.mjs's
// `assetsInlineLimit: 0` already forces external; confirmed against Astro 7.3's
// `core/build/plugins/plugin-scripts.js`, which this pair of scripts never goes through):
//   1. the client-hydration bootstrap that dispatches the `astro:load` event;
//   2. the `<astro-island>` custom element definition (registers `customElements.define(...)`).
// These two fingerprints (Astro's own internal APIs, never written by this repo's own code) are the
// ONLY documented exceptions -- any other un-sourced inline script still fails below. Discovered
// while implementing D-W7-4 (brief W-7): flagged to the controller as a spec-vs-reality gap (the
// spec's "cero scripts inline" cannot be 100% literal on a page using client-hydrated islands).
const ASTRO_CORE_INLINE_SCRIPT_FINGERPRINTS = [
  // `s` (dotAll) flag: the minified production build is single-line, but Prettier reformats the
  // fixture's copy across several lines (`check_headers.test.mjs`/its "OK" fixture) -- without
  // dotAll, `.` never matches the newlines in between, so this failed to recognize its own fixture.
  /self\.Astro\b.*astro:load/s,
  /customElements\.(?:get|define)\(["']astro-island["']\)/,
];

function isAstroCoreInlineScript(body) {
  return ASTRO_CORE_INLINE_SCRIPT_FINGERPRINTS.some((pattern) => pattern.test(body));
}

/** Returns every inline (no `src`) `<script>` open tag in `html`, except Astro's own core scripts. */
export function findInlineScriptTags(html) {
  const offenders = [];
  let match;
  while ((match = SCRIPT_ELEMENT_PATTERN.exec(html)) !== null) {
    const [fullElement, attrs, body] = match;
    if (/\bsrc\s*=/.test(attrs)) continue; // has a src -- not inline, nothing to flag
    if (isAstroCoreInlineScript(body)) continue; // one of the two documented exceptions
    offenders.push(fullElement.slice(0, fullElement.indexOf('>') + 1));
  }
  return offenders;
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
    const inlineScripts = findInlineScriptTags(html);
    if (inlineScripts.length > 0) {
      problems.push(
        `${path.relative(resolvedDist, file)}: inline <script> tag(s) violate script-src 'self': ${inlineScripts.join(', ')}`,
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
    `check_headers: OK -- '${distDir}/_headers' has every mandatory directive and no inline <script> found in ${htmlFiles.length} HTML file(s).`,
  );
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main();
}
