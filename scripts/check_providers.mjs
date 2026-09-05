#!/usr/bin/env node
/**
 * Ratchet (brief W-9, entregable W9-1b, CU-W9-3): provider-name honesty by ROUTE, over the text of
 * `dist/**\/*.html` (CLAIMS_MATRIX rules 3 and 4, CLAUDE.md raíz regla dura D-4 -- "Nombres de
 * proveedores... jamás en... el copy de cliente").
 *
 *   - `Deepgram`, `ElevenLabs`, `LiveKit` (letsylabs' own internal adapters, never named on a public
 *     surface): forbidden on EVERY route, no exception.
 *   - `Asterisk`, `3CX`, `SIP` (third-party telephony standards/software the CUSTOMER already runs,
 *     not a provider letsylabs resells -- CLAIMS_MATRIX rule 4): allowed ONLY on the routes where they
 *     genuinely appear.
 *   - `Voxtral` (an open-weight model adapter cited by the design handoff, same category as
 *     "Rust"/"Apache-2.0" -- CLAIMS_MATRIX row): allowed ONLY on the routes where it genuinely appears.
 *
 * Complements (does not replace) `scripts/check_third_party.sh`: that script polices RESOURCE
 * LOADING (`<script src>`, `<link href>`, `<img>`, `<form action>`... from a third-party origin) and
 * has no logic at all about provider NAMES appearing in the page's own text -- there is nothing in it
 * to deduplicate. This script is the first (and only) ratchet for that.
 *
 * The per-term route allowlists below were verified against the REAL built site (`pnpm build` +
 * grep), not copied from the brief's suggestion, which differed on two points (documented in
 * CLAIMS_MATRIX.md's "W-9 — matriz ejecutable" section too): `SIP` never appears on `/self-host` (the
 * brief expected it there), and `Voxtral` never appears on `/self-host` either (decision already taken
 * in W-4: `/self-host`'s own terminal line deliberately omits the word) -- both are Home + one
 * standalone page only.
 *
 * Run as `pnpm providers:check` (== `node scripts/check_providers.mjs dist`).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { routeFromDistRelativePath } from './check_claims.mjs';

/** Forbidden on every route, no exception -- letsylabs' own internal provider adapters. */
export const FORBIDDEN_EVERYWHERE = ['Deepgram', 'ElevenLabs', 'LiveKit'];

/**
 * Third-party names allowed ONLY on these routes (English-canonical path; both locales of a route
 * share one allowlist, e.g. '/telephony' covers '/telephony' and '/es/telephony'). Verified against
 * the real `dist/` build -- see file-level doc comment above for the 2 points where this differs from
 * the brief's initial suggestion.
 */
export const ALLOWED_ROUTES_BY_TERM = {
  Asterisk: ['/', '/telephony'],
  '3CX': ['/', '/telephony'],
  SIP: ['/', '/telephony'],
  Voxtral: ['/', '/open-source'],
};

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** @param {string} term @returns {RegExp} case-insensitive, word-bounded. */
function termPattern(term) {
  return new RegExp(`\\b${escapeRegExp(term)}\\b`, 'i');
}

/**
 * Every forbidden-everywhere term found in `html`, regardless of route.
 * @returns {string[]}
 */
export function findForbiddenHits(html) {
  return FORBIDDEN_EVERYWHERE.filter((term) => termPattern(term).test(html));
}

/**
 * Every route-restricted term found in `html` whose `route` is NOT in that term's allowlist.
 * `route` is an English-canonical path ('/', '/telephony'...) as returned by
 * `routeFromDistRelativePath`; `null` (unmapped file) is treated as "not on any allowlist" -- fails
 * closed rather than silently skipping an unrecognized page.
 * @returns {string[]}
 */
export function findOutOfRouteHits(html, route) {
  const hits = [];
  for (const [term, allowedRoutes] of Object.entries(ALLOWED_ROUTES_BY_TERM)) {
    if (!termPattern(term).test(html)) continue;
    if (route !== null && allowedRoutes.includes(route)) continue;
    hits.push(term);
  }
  return hits;
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
    console.log(`check_providers: '${distDir}' does not exist yet -- nothing to check.`);
    return;
  }
  if (!stat.isDirectory()) {
    console.log(`check_providers: '${distDir}' is not a directory -- nothing to check.`);
    return;
  }

  const htmlFiles = listHtmlFiles(resolvedDist);
  const problems = [];

  for (const file of htmlFiles) {
    const relativePath = path.relative(resolvedDist, file);
    const html = readFileSync(file, 'utf8');
    const route = routeFromDistRelativePath(relativePath);

    for (const term of findForbiddenHits(html)) {
      problems.push(
        `${relativePath}: forbidden provider name "${term}" (never allowed, any route)`,
      );
    }
    for (const term of findOutOfRouteHits(html, route)) {
      const allowed = ALLOWED_ROUTES_BY_TERM[term].join(', ');
      problems.push(
        `${relativePath}: "${term}" found on route ${route ?? '(unrecognized)'}, only allowed on: ${allowed}`,
      );
    }
  }

  if (problems.length > 0) {
    console.error('check_providers: FAILED:');
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `check_providers: OK -- ${htmlFiles.length} HTML file(s) scanned, no forbidden provider names and every route-restricted name stayed on its allowed route(s).`,
  );
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main();
}
