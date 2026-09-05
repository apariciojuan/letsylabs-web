#!/usr/bin/env node
/**
 * Ratchet (brief W-8, entregable W8-1a, CU-W8-1): after `pnpm build`, every real HTML page in `dist`
 * must have a unique `<title>`, a non-empty `<meta name="description">`, an absolute `<link
 * rel="canonical">` matching that page's own URL, exactly 3 absolute `<link rel="alternate"
 * hreflang>` entries (en/es/x-default), and a present `og:image` reference (existence/dimensions are
 * `check_og.mjs`'s job -- this only checks the tag is there and non-empty, no logic duplicated
 * between the two). The home page (both locales) must ALSO carry exactly one valid
 * `application/ld+json` `SoftwareApplication` script; every other page must carry NONE. Run as `pnpm
 * seo:check` (== `node scripts/check_seo.mjs`).
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

/** @param {string} html @param {RegExp} pattern (must have exactly one capture group) */
function matchAllGroup1(html, pattern) {
  return [...html.matchAll(pattern)].map((m) => m[1]);
}

/**
 * Every problem found in one page's `<head>`, or `[]` if it is clean. `isHome` gates the JSON-LD
 * check (home-only, see the file-level doc comment).
 * @param {string} html
 * @param {boolean} isHome
 * @returns {string[]}
 */
export function findSeoProblems(html, isHome) {
  const problems = [];

  const titleMatch = /<title>([^<]*)<\/title>/.exec(html);
  if (!titleMatch || titleMatch[1].trim() === '') problems.push('missing or empty <title>');

  const descriptionMatch = /<meta name="description" content="([^"]*)"/.exec(html);
  if (!descriptionMatch || descriptionMatch[1].trim() === '') {
    problems.push('missing or empty <meta name="description">');
  }

  const canonicalMatch = /<link rel="canonical" href="([^"]*)"/.exec(html);
  if (!canonicalMatch) {
    problems.push('missing <link rel="canonical">');
  } else if (!/^https?:\/\//.test(canonicalMatch[1])) {
    problems.push(`canonical href is not absolute: "${canonicalMatch[1]}"`);
  }

  const hreflangs = matchAllGroup1(
    html,
    /<link rel="alternate" hreflang="([^"]*)" href="([^"]*)"/g,
  );
  const hreflangHrefs = matchAllGroup1(
    html,
    /<link rel="alternate" hreflang="[^"]*" href="([^"]*)"/g,
  );
  if (hreflangs.length !== 3 || !['en', 'es', 'x-default'].every((h) => hreflangs.includes(h))) {
    problems.push(`expected hreflang en+es+x-default, got: ${hreflangs.join(',') || '(none)'}`);
  }
  for (const href of hreflangHrefs) {
    if (!/^https?:\/\//.test(href)) problems.push(`hreflang href is not absolute: "${href}"`);
  }

  const ogImageMatch = /<meta property="og:image" content="([^"]*)"/.exec(html);
  if (!ogImageMatch || ogImageMatch[1].trim() === '') {
    problems.push('missing or empty <meta property="og:image">');
  }

  const jsonLdMatches = [
    ...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g),
  ];
  if (isHome) {
    if (jsonLdMatches.length !== 1) {
      problems.push(`home page must have exactly 1 JSON-LD script, found ${jsonLdMatches.length}`);
    } else {
      try {
        const parsed = JSON.parse(jsonLdMatches[0][1]);
        if (parsed['@type'] !== 'SoftwareApplication') {
          problems.push(
            `home JSON-LD @type expected 'SoftwareApplication', got '${parsed['@type']}'`,
          );
        }
      } catch (error) {
        problems.push(`home JSON-LD is not valid JSON: ${error.message}`);
      }
    }
  } else if (jsonLdMatches.length > 0) {
    problems.push(`non-home page must have NO JSON-LD script, found ${jsonLdMatches.length}`);
  }

  return problems;
}

/** `true` when `relativeToDist` (e.g. 'index.html', 'es/index.html') is a home page. */
export function isHomePage(relativeToDist) {
  return relativeToDist === 'index.html' || relativeToDist === path.join('es', 'index.html');
}

function main() {
  const distDir = process.argv[2] ?? 'dist';
  const resolvedDist = path.resolve(distDir);

  let stat;
  try {
    stat = statSync(resolvedDist);
  } catch {
    console.log(`check_seo: '${distDir}' does not exist yet -- nothing to check.`);
    return;
  }
  if (!stat.isDirectory()) {
    console.log(`check_seo: '${distDir}' is not a directory -- nothing to check.`);
    return;
  }

  const htmlFiles = listHtmlFiles(resolvedDist);
  const problems = [];
  const titles = new Map(); // title text -> [relative file paths]

  for (const file of htmlFiles) {
    const relative = path.relative(resolvedDist, file);
    const html = readFileSync(file, 'utf8');
    for (const problem of findSeoProblems(html, isHomePage(relative))) {
      problems.push(`${relative}: ${problem}`);
    }
    const titleMatch = /<title>([^<]*)<\/title>/.exec(html);
    if (titleMatch) {
      const list = titles.get(titleMatch[1]) ?? [];
      list.push(relative);
      titles.set(titleMatch[1], list);
    }
  }

  for (const [title, files] of titles) {
    if (files.length > 1) {
      problems.push(`title "${title}" is used by more than one page: ${files.join(', ')}`);
    }
  }

  if (problems.length > 0) {
    console.error(`check_seo: FAILED in ${distDir}:`);
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `check_seo: OK -- ${htmlFiles.length} HTML file(s) have unique titles, descriptions, absolute canonical/hreflang, og:image, and correctly-scoped JSON-LD.`,
  );
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main();
}
