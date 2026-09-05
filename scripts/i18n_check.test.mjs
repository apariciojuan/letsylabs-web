import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkParity } from './i18n_check.mjs';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptsDir, '..');

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

describe('i18n_check: real catalog', () => {
  it('src/i18n/en.json and src/i18n/es.json are in parity', () => {
    const en = readJson('src/i18n/en.json');
    const es = readJson('src/i18n/es.json');
    expect(checkParity(en, es)).toEqual([]);
  });
});

describe('i18n_check: mismatched fixture (regression for CU-WEB-4)', () => {
  it('reports the missing key and the array length mismatch', () => {
    const en = readJson('scripts/fixtures/i18n_mismatched/en.json');
    const es = readJson('scripts/fixtures/i18n_mismatched/es.json');
    const problems = checkParity(en, es);

    expect(problems.length).toBeGreaterThan(0);
    expect(problems.join('\n')).toContain('common.languageSwitch.es');
    expect(problems.join('\n')).toContain('home.tags[]:3');
  });
});
