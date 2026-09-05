import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { findBarePlaceholderTokens } from './check_placeholders.mjs';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const checkPlaceholdersMjs = path.join(scriptsDir, 'check_placeholders.mjs');

function readFixture(name) {
  return readFileSync(path.join(scriptsDir, 'fixtures', name, 'index.html'), 'utf8');
}

function run(fixtureDirRelativePath) {
  const fixtureDir = path.join(scriptsDir, fixtureDirRelativePath);
  return spawnSync('node', [checkPlaceholdersMjs, fixtureDir], { encoding: 'utf8' });
}

describe('findBarePlaceholderTokens (logic unit)', () => {
  it('does not flag a {TOKEN} inside an element carrying data-placeholder', () => {
    const html = readFixture('dist_placeholder_ok');
    expect(findBarePlaceholderTokens(html)).toEqual([]);
  });

  it('flags a bare {TOKEN} left outside any data-placeholder element', () => {
    const html = readFixture('dist_placeholder_bad');
    expect(findBarePlaceholderTokens(html)).toEqual(['{PRICE}']);
  });

  it('ignores lowercase or mixed-case braces (not a MAYÚSCULAS token)', () => {
    expect(findBarePlaceholderTokens('<p>set { price } here, or {price}</p>')).toEqual([]);
  });

  it('supports Spanish accented tokens (W-5 reuse: {ARTÍCULO})', () => {
    expect(findBarePlaceholderTokens('<p>{ARTÍCULO}</p>')).toEqual(['{ARTÍCULO}']);
  });
});

describe('check_placeholders.mjs (CLI, dist/**/*.html ratchet)', () => {
  it('passes (exit 0) when every {TOKEN} sits inside a data-placeholder element', () => {
    const result = run('fixtures/dist_placeholder_ok');
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('OK');
  });

  it('fails (exit 1) when a {TOKEN} is left bare', () => {
    const result = run('fixtures/dist_placeholder_bad');
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('{PRICE}');
  });

  it('passes (exit 0) when the dist dir does not exist yet (nothing built)', () => {
    const result = run('fixtures/no_such_dist_dir');
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('does not exist yet');
  });
});
