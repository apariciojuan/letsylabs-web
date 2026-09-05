#!/usr/bin/env node
/**
 * Ratchet: any `{UPPERCASE}` token in the built HTML (a marked-honest hole, e.g. `{PRICE}` on
 * /pricing -- brief W-6, reused by W-5 for `{ARTÍCULO}`) must sit inside an element carrying
 * `data-placeholder` (rendered by `src/components/Placeholder.astro`). A bare `{TOKEN}` anywhere
 * else in the shipped HTML means either a real value was forgotten, or someone typed a
 * placeholder-looking string outside the honest-hole component -- both are the same bug: an
 * un-marked hole in the page. Run as `pnpm placeholders:check`
 * (== `node scripts/check_placeholders.mjs`). Same shape as `scripts/i18n_check.mjs`: logic
 * exported for `scripts/check_placeholders.test.mjs`, `main()` walks the real `dist/` tree.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const TOKEN_PATTERN = /\{[A-ZÁÉÍÓÚÑ_]+\}/g;

// Non-greedy match of a whole element (open tag through its matching close tag by tag name) whose
// open tag carries a `data-placeholder="..."` attribute. `Placeholder.astro` renders a single
// `<span>` with no nested elements, so this simple (non-recursive) pattern is enough -- it does not
// need to handle nested elements of the same tag name.
const PLACEHOLDER_ELEMENT_PATTERN =
  /<([a-z0-9-]+)\b[^>]*\bdata-placeholder=(["'])[^"']*\2[^>]*>[\s\S]*?<\/\1>/gi;

/**
 * Returns every `{TOKEN}` match found in `html` that is NOT inside an element carrying
 * `data-placeholder` -- i.e. the bare, un-marked occurrences the ratchet must fail on. Strips every
 * marked-placeholder element first (open tag, its content, its close tag), then scans what remains.
 */
export function findBarePlaceholderTokens(html) {
  const withoutMarkedHoles = html.replace(PLACEHOLDER_ELEMENT_PATTERN, '');
  return withoutMarkedHoles.match(TOKEN_PATTERN) ?? [];
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
    console.log(`check_placeholders: '${distDir}' does not exist yet -- nothing to check.`);
    return;
  }
  if (!stat.isDirectory()) {
    console.log(`check_placeholders: '${distDir}' is not a directory -- nothing to check.`);
    return;
  }

  const htmlFiles = listHtmlFiles(resolvedDist);
  const problems = [];
  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf8');
    const bareTokens = findBarePlaceholderTokens(html);
    if (bareTokens.length > 0) {
      problems.push(`${path.relative(resolvedDist, file)}: ${bareTokens.join(', ')}`);
    }
  }

  if (problems.length > 0) {
    console.error(
      `check_placeholders: FAILED -- found bare {TOKEN} placeholder(s) outside a data-placeholder element in ${distDir}:`,
    );
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `check_placeholders: OK -- no bare {TOKEN} placeholders found outside data-placeholder elements in ${distDir} (${htmlFiles.length} file(s) scanned).`,
  );
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main();
}
