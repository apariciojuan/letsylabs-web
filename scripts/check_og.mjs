#!/usr/bin/env node
/**
 * Ratchet (brief W-8, entregable W8-1b, CU-W8-2): after `pnpm build`, every (page, locale) pair from
 * `src/lib/site-routes.ts` must have its OG image PNG in `dist/og/`, that PNG must be exactly
 * 1200x630 (the standard `og:image` size, matching `BaseLayout.astro`'s `og:image:width/height`), and
 * every built HTML page's `<meta property="og:image">` must point at a file that actually exists in
 * `dist`. Run as `pnpm og:check` (== `node scripts/check_og.mjs`).
 *
 * PNG width/height are read directly from the IHDR chunk (bytes 16-23 of any valid PNG,
 * https://www.w3.org/TR/png/#11IHDR) -- no image-decoding dependency needed for two 4-byte
 * big-endian integers.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { locales } from '../src/i18n/index.ts';
import { SITE_PATHS } from '../src/lib/site-routes.ts';
import { ogImagePathFor } from '../src/lib/seo.ts';

/**
 * The width/height encoded in a PNG's IHDR chunk. Throws if `buffer` is not a valid PNG (wrong magic
 * bytes) -- callers pass a file they already listed by `.png` extension, so a mismatch here means a
 * corrupt/truncated file, worth failing loudly on.
 * @param {Buffer} buffer
 * @returns {{ width: number, height: number }}
 */
export function pngDimensions(buffer) {
  const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (!buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error('pngDimensions: not a valid PNG (bad signature)');
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

/** Every (page, locale) OG image path (`/og/<slug>-<locale>.png`) this build is expected to ship. */
export function expectedOgImagePaths() {
  return SITE_PATHS.flatMap((path) => locales.map((locale) => ogImagePathFor(path, locale)));
}

/**
 * Every `<meta property="og:image">` reference found in `html`, as its `content` attribute value.
 * @param {string} html
 * @returns {string[]}
 */
export function findOgImageRefs(html) {
  const refs = [];
  const pattern = /<meta[^>]*property=["']og:image["'][^>]*>/gi;
  let match;
  while ((match = pattern.exec(html)) !== null) {
    const contentMatch = /content=["']([^"']+)["']/i.exec(match[0]);
    if (contentMatch) refs.push(contentMatch[1]);
  }
  return refs;
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
    console.log(`check_og: '${distDir}' does not exist yet -- nothing to check.`);
    return;
  }
  if (!stat.isDirectory()) {
    console.log(`check_og: '${distDir}' is not a directory -- nothing to check.`);
    return;
  }

  const problems = [];

  for (const ogPath of expectedOgImagePaths()) {
    const filePath = path.join(resolvedDist, ogPath);
    let buffer;
    try {
      buffer = readFileSync(filePath);
    } catch {
      problems.push(
        `${ogPath}: missing (run 'pnpm og:render' -- OG PNGs are versioned, not built)`,
      );
      continue;
    }
    const { width, height } = pngDimensions(buffer);
    if (width !== 1200 || height !== 630) {
      problems.push(`${ogPath}: expected 1200x630, got ${width}x${height}`);
    }
  }

  const htmlFiles = listHtmlFiles(resolvedDist);
  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf8');
    for (const ref of findOgImageRefs(html)) {
      const url = new URL(ref);
      const referencedFile = path.join(resolvedDist, url.pathname);
      try {
        statSync(referencedFile);
      } catch {
        problems.push(
          `${path.relative(resolvedDist, file)}: og:image references '${ref}', which does not exist in dist`,
        );
      }
    }
  }

  if (problems.length > 0) {
    console.error(`check_og: FAILED in ${distDir}:`);
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `check_og: OK -- every OG image exists at 1200x630 and every og:image reference in ${htmlFiles.length} HTML file(s) resolves.`,
  );
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main();
}
