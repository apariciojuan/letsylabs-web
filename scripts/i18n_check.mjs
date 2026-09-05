#!/usr/bin/env node
/**
 * Ratchet: `src/i18n/en.json` and `src/i18n/es.json` must stay in parity — same set of nested keys,
 * and same array lengths (CU-WEB-4 / brief W-1 entregable 2). Run as `pnpm i18n:check`
 * (== `node scripts/i18n_check.mjs`). The comparison logic is exported so
 * `scripts/i18n_check.test.mjs` can exercise it against a deliberately mismatched fixture without
 * touching the real catalog.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Collects every path into `value` as a dot-notation string. Objects contribute one entry per key
 * (plus their children); arrays contribute a `<prefix>[]:<length>` entry (so a length mismatch is a
 * diff) plus one recursive entry per element (so nested object/array shape mismatches are caught
 * too).
 */
export function collectPaths(value, prefix = '') {
  if (Array.isArray(value)) {
    const lengthMarker = `${prefix}[]:${value.length}`;
    return [
      lengthMarker,
      ...value.flatMap((item, index) => collectPaths(item, `${prefix}[${index}]`)),
    ];
  }
  if (value !== null && typeof value === 'object') {
    return Object.keys(value).flatMap((key) => {
      const nextPrefix = prefix ? `${prefix}.${key}` : key;
      return [nextPrefix, ...collectPaths(value[key], nextPrefix)];
    });
  }
  // Scalar leaf: record its type too, so `true` in one catalog and "sí" in the other is a diff
  // (adversarial review W-1 H5).
  return [`${prefix}=${value === null ? 'null' : typeof value}`];
}

/** Returns a list of human-readable problems, or an empty array if the two catalogs are in parity. */
export function checkParity(baseCatalog, otherCatalog, baseLabel = 'en', otherLabel = 'es') {
  const basePaths = new Set(collectPaths(baseCatalog));
  const otherPaths = new Set(collectPaths(otherCatalog));

  const missingInOther = [...basePaths].filter((p) => !otherPaths.has(p));
  const missingInBase = [...otherPaths].filter((p) => !basePaths.has(p));

  const problems = [];
  if (missingInOther.length > 0) {
    problems.push(
      `present in ${baseLabel} but missing in ${otherLabel}: ${missingInOther.join(', ')}`,
    );
  }
  if (missingInBase.length > 0) {
    problems.push(
      `present in ${otherLabel} but missing in ${baseLabel}: ${missingInBase.join(', ')}`,
    );
  }
  return problems;
}

function main() {
  const repoRoot = path.resolve(fileURLToPath(import.meta.url), '..', '..');
  const enPath = path.join(repoRoot, 'src/i18n/en.json');
  const esPath = path.join(repoRoot, 'src/i18n/es.json');

  const en = JSON.parse(readFileSync(enPath, 'utf8'));
  const es = JSON.parse(readFileSync(esPath, 'utf8'));

  const problems = checkParity(en, es);
  if (problems.length > 0) {
    console.error('i18n:check FAILED — src/i18n/en.json and src/i18n/es.json are not in parity:');
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exitCode = 1;
    return;
  }
  console.log(
    `i18n:check OK — en.json and es.json are in parity (${collectPaths(en).length} key paths).`,
  );
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main();
}
