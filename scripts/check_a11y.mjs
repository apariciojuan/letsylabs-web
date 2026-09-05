#!/usr/bin/env node
/**
 * Ratchet (brief W-8, entregable W8-3a): after `pnpm build`, every real HTML page in `dist` must
 * have exactly one `<h1>`, no heading-level skip (an `<h3>` appearing before any `<h2>`, etc.),
 * `<html lang>` matching the page's own locale (its dist path), and the 4 landmark elements
 * (`header`, `nav`, `main`, `footer`). Run as `pnpm a11y:check` (== `node scripts/check_a11y.mjs`).
 *
 * This repo has no `<h3>`/`<h4>` anywhere today (confirmed by grep across `src/components` and
 * `src/pages` while writing this brief) -- the heading check exists to PIN that fact (a ratchet, not
 * a speculative rule): a future page introducing a skipped level fails the build, rather than the gap
 * only ever being noticed by a screen-reader user.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function listHtmlFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listHtmlFiles(fullPath);
    if (entry.isFile() && entry.name.endsWith('.html')) return [fullPath];
    return [];
  });
}

/**
 * Every `<h1>`-`<h6>` heading level found in `html`'s BODY, in document order (the `<head>`'s own
 * `<title>` is not a heading and is deliberately excluded by only scanning after the first
 * `<body`/`<main` tag would be more precise, but this repo never puts an `hN` element in `<head>`, so
 * a plain whole-document scan is exactly as accurate and far simpler).
 * @param {string} html
 * @returns {number[]}
 */
export function headingLevels(html) {
  return [...html.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
}

/**
 * Problems with `html`'s heading structure: not exactly one `<h1>`, or any level appearing before a
 * lower level has ever been seen (a "skip", e.g. `<h3>` with no prior `<h2>`).
 * @param {string} html
 * @returns {string[]}
 */
export function findHeadingProblems(html) {
  const levels = headingLevels(html);
  const problems = [];
  const h1Count = levels.filter((level) => level === 1).length;
  if (h1Count !== 1) problems.push(`expected exactly one <h1>, found ${h1Count}`);

  let maxSeen = 0;
  for (const level of levels) {
    if (level > maxSeen + 1) {
      problems.push(
        `heading level skips from h${maxSeen} to h${level} (order: ${levels.join(',')})`,
      );
      break; // one report per page is enough -- avoid a flood of the same underlying issue
    }
    maxSeen = Math.max(maxSeen, level);
  }
  return problems;
}

/**
 * Problems with `html`'s landmark structure: any of `header`/`nav`/`main`/`footer` missing.
 * @param {string} html
 * @returns {string[]}
 */
export function findLandmarkProblems(html) {
  const required = ['header', 'nav', 'main', 'footer'];
  return required
    .filter((tag) => !new RegExp(`<${tag}[\\s>]`).test(html))
    .map((tag) => `missing <${tag}> landmark`);
}

/** The locale a dist HTML file's own path implies: 'es/...' -> 'es', everything else -> 'en'. */
export function expectedLocaleFor(relativeToDist) {
  const segments = relativeToDist.split(path.sep);
  return segments[0] === 'es' ? 'es' : 'en';
}

/**
 * `html[lang]` problems: missing entirely, or not matching `expectedLocale`.
 * @param {string} html
 * @param {string} expectedLocale
 * @returns {string[]}
 */
export function findLangProblems(html, expectedLocale) {
  const match = /<html[^>]*\blang="([^"]*)"/.exec(html);
  if (!match) return ['<html> tag has no lang attribute'];
  if (match[1] !== expectedLocale) {
    return [`<html lang="${match[1]}">, expected "${expectedLocale}"`];
  }
  return [];
}

function main() {
  const distDir = process.argv[2] ?? 'dist';
  const resolvedDist = path.resolve(distDir);

  let stat;
  try {
    stat = statSync(resolvedDist);
  } catch {
    console.log(`check_a11y: '${distDir}' does not exist yet -- nothing to check.`);
    return;
  }
  if (!stat.isDirectory()) {
    console.log(`check_a11y: '${distDir}' is not a directory -- nothing to check.`);
    return;
  }

  const htmlFiles = listHtmlFiles(resolvedDist);
  const problems = [];

  for (const file of htmlFiles) {
    const relative = path.relative(resolvedDist, file);
    const html = readFileSync(file, 'utf8');
    for (const problem of [
      ...findHeadingProblems(html),
      ...findLandmarkProblems(html),
      ...findLangProblems(html, expectedLocaleFor(relative)),
    ]) {
      problems.push(`${relative}: ${problem}`);
    }
  }

  if (problems.length > 0) {
    console.error(`check_a11y: FAILED in ${distDir}:`);
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `check_a11y: OK -- ${htmlFiles.length} HTML file(s) have exactly one <h1>, no heading skip, correct <html lang>, and all 4 landmarks.`,
  );
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main();
}
