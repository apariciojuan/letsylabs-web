import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import {
  expectedLocaleFor,
  findHeadingProblems,
  findLandmarkProblems,
  findLangProblems,
  headingLevels,
} from './check_a11y.mjs';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const checkA11yMjs = path.join(scriptsDir, 'check_a11y.mjs');

const VALID_PAGE = `<html lang="en"><head><title>x</title></head>
<body>
<header>nav bar</header>
<nav>links</nav>
<main><h1>Title</h1><h2>Section</h2><h2>Another</h2></main>
<footer>bottom</footer>
</body></html>`;

describe('headingLevels', () => {
  it('extracts heading levels in document order', () => {
    expect(headingLevels('<h1>a</h1><p>x</p><h2>b</h2><h2 class="x">c</h2>')).toEqual([1, 2, 2]);
  });

  it('returns an empty array when there are no headings', () => {
    expect(headingLevels('<p>no headings here</p>')).toEqual([]);
  });
});

describe('findHeadingProblems', () => {
  it('returns no problems for exactly one h1 and no level skip', () => {
    expect(findHeadingProblems(VALID_PAGE)).toEqual([]);
  });

  it('flags zero <h1>', () => {
    const html = VALID_PAGE.replace('<h1>Title</h1>', '');
    expect(findHeadingProblems(html)).toContain('expected exactly one <h1>, found 0');
  });

  it('flags more than one <h1>', () => {
    const html = VALID_PAGE.replace('<h1>Title</h1>', '<h1>Title</h1><h1>Second</h1>');
    expect(findHeadingProblems(html)).toContain('expected exactly one <h1>, found 2');
  });

  it('flags a level skip (h1 straight to h3, no h2)', () => {
    const html = '<html><body><h1>Title</h1><h3>Skipped</h3></body></html>';
    expect(findHeadingProblems(html).some((p) => p.includes('skips from h1 to h3'))).toBe(true);
  });
});

describe('findLandmarkProblems', () => {
  it('returns no problems when all 4 landmarks are present', () => {
    expect(findLandmarkProblems(VALID_PAGE)).toEqual([]);
  });

  it('flags each missing landmark', () => {
    const html = '<html><body><main><h1>x</h1></main></body></html>';
    const problems = findLandmarkProblems(html);
    expect(problems).toContain('missing <header> landmark');
    expect(problems).toContain('missing <nav> landmark');
    expect(problems).toContain('missing <footer> landmark');
    expect(problems).not.toContain('missing <main> landmark');
  });
});

describe('expectedLocaleFor', () => {
  it('maps an es/ path to "es"', () => {
    expect(expectedLocaleFor(path.join('es', 'voice', 'index.html'))).toBe('es');
  });

  it('maps every other path to "en"', () => {
    expect(expectedLocaleFor(path.join('voice', 'index.html'))).toBe('en');
    expect(expectedLocaleFor('index.html')).toBe('en');
  });
});

describe('findLangProblems', () => {
  it('returns no problems when lang matches', () => {
    expect(findLangProblems('<html lang="en">', 'en')).toEqual([]);
  });

  it('flags a missing lang attribute', () => {
    expect(findLangProblems('<html>', 'en')).toEqual(['<html> tag has no lang attribute']);
  });

  it('flags a mismatched lang attribute', () => {
    expect(findLangProblems('<html lang="es">', 'en')).toEqual(['<html lang="es">, expected "en"']);
  });
});

describe('check_a11y.mjs (CLI)', () => {
  let tmpDir;

  afterEach(() => {
    if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
  });

  function run(distDir) {
    return spawnSync('node', [checkA11yMjs, distDir], { encoding: 'utf8' });
  }

  it('passes (exit 0) for a valid dist', () => {
    tmpDir = mkdtempSync(path.join(tmpdir(), 'check-a11y-'));
    writeFileSync(path.join(tmpDir, 'index.html'), VALID_PAGE);
    mkdirSync(path.join(tmpDir, 'es'));
    writeFileSync(
      path.join(tmpDir, 'es', 'index.html'),
      VALID_PAGE.replace('lang="en"', 'lang="es"'),
    );
    const result = run(tmpDir);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('OK');
  });

  it('fails (exit 1) when an es/ page keeps lang="en"', () => {
    tmpDir = mkdtempSync(path.join(tmpdir(), 'check-a11y-'));
    mkdirSync(path.join(tmpDir, 'es'));
    writeFileSync(path.join(tmpDir, 'es', 'index.html'), VALID_PAGE); // still lang="en"
    const result = run(tmpDir);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('expected "es"');
  });

  it('passes (exit 0) when the dist dir does not exist yet', () => {
    const result = run(path.join(tmpdir(), 'no-such-check-a11y-dist'));
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('does not exist yet');
  });
});
