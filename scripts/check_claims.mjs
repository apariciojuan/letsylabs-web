#!/usr/bin/env node
/**
 * Ratchet (brief W-9, entregable W9-1a): `CLAIMS_MATRIX.md` is the authority on whether a claim is
 * honest -- this script only catches OMISSIONS, three of them:
 *
 *   (a) a watched term appears somewhere in `dist/**\/*.html` on a page that has NO row at all in
 *       CLAIMS_MATRIX.md ("Página" column) -- i.e. nobody looked at this claim yet.
 *   (b) a matrix row whose Estado is `target` (a performance figure with no sealed measurement,
 *       CLAIMS_MATRIX rule 6) has no `data-claim-state="target"` element in the built HTML of every
 *       page that carries it -- i.e. the "target" marking promised by the matrix was never applied.
 *   (c) with `PUBLIC_SITE_ENV=production`, ANY row whose Estado is `bloqueante` makes the build fail
 *       -- the site does not publish with unresolved claims (CU-W9-4). This check does not scan
 *       `dist/` at all: it is purely a read of the matrix, so it fires even if the offending page
 *       hasn't been rebuilt yet.
 *
 * (a) and (b) are page-scoped, not sentence-scoped: this is a coarse, deliberately forgiving
 * heuristic ("el ratchet solo evita olvidos", docs/plans/web/09_claims.md "Riesgos"), not a
 * paraphrase-matcher -- some matrix rows quote a claim verbatim, others (Pricing/Company policy rows)
 * only summarize it, so requiring the exact watched term to appear inside the Afirmación cell text
 * would be too fragile. The check instead asks two coarser, still-meaningful questions: "does this
 * PAGE have at least one row in the matrix at all" (a), and "does this exact HTML file carry the
 * target marker" (b) -- both are always true for a page someone actually reviewed, and both go red
 * the moment a brand-new page/section ships with a watched term and nobody touched the matrix.
 *
 * Term-matching rules (documented per the brief -- "términos vigilados... configurables... y
 * documentados"): alphabetic terms ("production", "certified", "guaranteed", "never", "always",
 * "every", "available now") match on WORD BOUNDARIES, case-insensitive -- a plain substring match
 * would false-positive on "everything"/"everywhere" (a real occurrence: "Self-host everything,
 * open-weight models included." on /company, found during the W-9 audit). Numeric/symbolic terms
 * ("100%", "<1s", "20ms", "96ms", "<300ms", "61ms", "448ms", "142ms", "210ms") match as literal
 * substrings after HTML-entity decoding (Astro escapes "<" as "&lt;" in static text, e.g. the
 * Developers section's "&lt;1s" counter and Voice's "STT &lt;300ms partial" label -- a raw substring
 * search for "<1s" against the un-decoded HTML source would silently miss both).
 *
 * Run as `pnpm claims:check` (== `node scripts/check_claims.mjs dist CLAIMS_MATRIX.md`). Same shape
 * as the other dist-scanning ratchets (check_seo.mjs, check_placeholders.mjs): pure logic exported
 * for scripts/check_claims.test.mjs, main() walks the real dist/ tree and matrix file.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/** Watched terms (brief W-9). Add here + document the reason in the file-level comment above. */
export const WATCHED_TERMS = [
  'available now',
  'production',
  '100%',
  '<1s',
  '20ms',
  '96ms',
  '<300ms',
  '61ms',
  '448ms',
  '142ms',
  '210ms',
  'certified',
  'guaranteed',
  'never',
  'always',
  'every',
];

/**
 * Maps a CLAIMS_MATRIX.md "Página" label to its English-canonical route path (same shape as
 * `SITE_ROUTES` in src/lib/site-routes.ts, kept in sync by hand -- this script is plain JS/CLI and
 * cannot import that TypeScript module directly). `/privacy` and `/terms` are deliberately absent:
 * neither has ever carried a matrix row, so any watched term landing there in the future is exactly
 * the kind of omission this ratchet exists to catch.
 */
export const PAGE_LABEL_TO_PATH = {
  Home: '/',
  Voice: '/voice',
  Telephony: '/telephony',
  Compliance: '/compliance',
  'Self-host': '/self-host',
  'Open source': '/open-source',
  Pricing: '/pricing',
  Company: '/company',
};

function decodeHtmlEntities(html) {
  return html
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const ALPHABETIC_TERM_PATTERN = /^[a-z ]+$/i;

/** @param {string} term @returns {RegExp} */
function termPattern(term) {
  const escaped = escapeRegExp(term);
  if (ALPHABETIC_TERM_PATTERN.test(term)) {
    return new RegExp(`\\b${escaped.replace(/ /g, '\\s+')}\\b`, 'i');
  }
  return new RegExp(escaped, 'i');
}

/** Every watched term (see WATCHED_TERMS) found in `html`, entity-decoded first (see file doc). */
export function findWatchedTermHits(html) {
  const decoded = decodeHtmlEntities(html);
  return WATCHED_TERMS.filter((term) => termPattern(term).test(decoded));
}

/** `true` when `html` carries at least one `data-claim-state="target"` element. */
export function hasTargetMarker(html) {
  return /data-claim-state=["']target["']/.test(html);
}

/**
 * `relPath` is a path relative to `dist/` (e.g. 'index.html', 'es/voice/index.html'). Returns the
 * English-canonical route ('/', '/voice'...) or `null` for anything not shaped like a page (assets,
 * sitemap.xml, robots.txt) so callers can skip it.
 */
export function routeFromDistRelativePath(relPath) {
  const normalized = relPath.split(path.sep).join('/');
  if (!normalized.endsWith('index.html')) return null;
  const withoutLocale = normalized.startsWith('es/') ? normalized.slice(3) : normalized;
  const withoutFile = withoutLocale.slice(0, -'index.html'.length).replace(/\/$/, '');
  return withoutFile === '' ? '/' : `/${withoutFile}`;
}

/**
 * Parses the "Tabla de afirmaciones" in CLAIMS_MATRIX.md into rows. Deliberately tolerant of prose
 * around the file (headers, the "Reglas" section, the "W-9" closing notes): it only looks at lines
 * starting with `|`, skips the header/separator rows, and skips any data row it cannot parse into (at
 * least) 4 cells rather than throwing -- this is a ratchet, not a markdown linter.
 * @returns {{ afirmacion: string, pages: string[], estado: string | null }[]}
 */
export function parseClaimsMatrix(markdown) {
  const rows = [];
  for (const line of markdown.split('\n')) {
    if (!line.startsWith('|')) continue;
    if (line.includes('Afirmación') && line.includes('Página')) continue; // header
    if (/^\|[\s-]+\|/.test(line)) continue; // separator row (|---|---|...)
    const cells = line
      .slice(1, line.endsWith('|') ? -1 : undefined)
      .split('|')
      .map((cell) => cell.trim());
    if (cells.length < 4) continue;
    const [afirmacion, paginaCell, , estadoCell] = cells;
    const pages = paginaCell
      .split(',')
      .map((page) => page.trim())
      .filter(Boolean);
    const estadoMatch = /^`([a-z0-9/-]+)`/i.exec(estadoCell);
    rows.push({ afirmacion, pages, estado: estadoMatch ? estadoMatch[1].toLowerCase() : null });
  }
  return rows;
}

/**
 * (a) Every {term, route} pair actually found in `distFiles` must belong to a route that has at
 * least one CLAIMS_MATRIX row. `distFiles` is `[{ relativePath, html }]`.
 * @returns {{ term: string, route: string, file: string }[]}
 */
export function findMissingRowProblems(distFiles, matrixRows) {
  const pagesWithRows = new Set();
  for (const row of matrixRows) {
    for (const label of row.pages) {
      const routePath = PAGE_LABEL_TO_PATH[label];
      if (routePath) pagesWithRows.add(routePath);
    }
  }

  const problems = [];
  for (const { relativePath, html } of distFiles) {
    const route = routeFromDistRelativePath(relativePath);
    if (route === null) continue;
    if (pagesWithRows.has(route)) continue;
    for (const term of findWatchedTermHits(html)) {
      problems.push({ term, route, file: relativePath });
    }
  }
  return problems;
}

/**
 * (b) Every HTML file whose route carries at least one `target`-state row must itself contain a
 * `data-claim-state="target"` element.
 * @returns {{ route: string, file: string }[]}
 */
export function findMissingTargetMarkerProblems(distFiles, matrixRows) {
  const targetPages = new Set();
  for (const row of matrixRows) {
    if (row.estado !== 'target') continue;
    for (const label of row.pages) {
      const routePath = PAGE_LABEL_TO_PATH[label];
      if (routePath) targetPages.add(routePath);
    }
  }

  const problems = [];
  for (const { relativePath, html } of distFiles) {
    const route = routeFromDistRelativePath(relativePath);
    if (route === null || !targetPages.has(route)) continue;
    if (!hasTargetMarker(html)) problems.push({ route, file: relativePath });
  }
  return problems;
}

/** (c) Every row whose Estado is `bloqueante`, matrix-only (no dist/ needed). */
export function findBlockingRows(matrixRows) {
  return matrixRows.filter((row) => row.estado === 'bloqueante');
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
  const matrixPath = process.argv[3] ?? 'CLAIMS_MATRIX.md';
  const isProduction = process.env.PUBLIC_SITE_ENV === 'production';

  let matrixMarkdown;
  try {
    matrixMarkdown = readFileSync(matrixPath, 'utf8');
  } catch {
    console.error(`check_claims: FAILED -- could not read matrix file '${matrixPath}'.`);
    process.exitCode = 1;
    return;
  }
  const matrixRows = parseClaimsMatrix(matrixMarkdown);

  const problems = [];

  if (isProduction) {
    const blockingRows = findBlockingRows(matrixRows);
    for (const row of blockingRows) {
      problems.push(
        `[production] bloqueante row (${row.pages.join(', ')}): "${row.afirmacion.slice(0, 120)}${row.afirmacion.length > 120 ? '…' : ''}"`,
      );
    }
  }

  const resolvedDist = path.resolve(distDir);
  let distStat;
  try {
    distStat = statSync(resolvedDist);
  } catch {
    distStat = null;
  }

  if (distStat && distStat.isDirectory()) {
    const distFiles = listHtmlFiles(resolvedDist).map((file) => ({
      relativePath: path.relative(resolvedDist, file),
      html: readFileSync(file, 'utf8'),
    }));

    for (const { term, route, file } of findMissingRowProblems(distFiles, matrixRows)) {
      problems.push(
        `${file}: watched term "${term}" found on ${route}, but ${route} has no row in ${matrixPath}`,
      );
    }
    for (const { route, file } of findMissingTargetMarkerProblems(distFiles, matrixRows)) {
      problems.push(
        `${file}: ${route} has a \`target\` row in ${matrixPath} but no data-claim-state="target" element in the built HTML`,
      );
    }
  } else {
    console.log(`check_claims: '${distDir}' does not exist yet -- skipping the dist/ scan (a, b).`);
  }

  if (problems.length > 0) {
    console.error(`check_claims: FAILED:`);
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `check_claims: OK -- ${matrixRows.length} matrix row(s) parsed` +
      (isProduction
        ? ', no `bloqueante` rows (production)'
        : ' (development: `bloqueante` rows not blocking)') +
      (distStat && distStat.isDirectory()
        ? `, every watched term found in ${distDir} has a row, every \`target\` row has its DOM marker.`
        : '.'),
  );
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main();
}
