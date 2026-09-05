import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { findSeoProblems, isHomePage } from './check_seo.mjs';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const checkSeoMjs = path.join(scriptsDir, 'check_seo.mjs');

const VALID_HEAD = `
<title>Voice — letsylabs</title>
<meta name="description" content="A real description.">
<link rel="canonical" href="https://letsylabs.com/voice">
<link rel="alternate" hreflang="en" href="https://letsylabs.com/voice">
<link rel="alternate" hreflang="es" href="https://letsylabs.com/es/voice">
<link rel="alternate" hreflang="x-default" href="https://letsylabs.com/voice">
<meta property="og:image" content="https://letsylabs.com/og/voice-en.png">
`;

const VALID_HOME_HEAD = `
<title>letsylabs — Realtime voice infrastructure</title>
<meta name="description" content="A real description.">
<link rel="canonical" href="https://letsylabs.com/">
<link rel="alternate" hreflang="en" href="https://letsylabs.com/">
<link rel="alternate" hreflang="es" href="https://letsylabs.com/es/">
<link rel="alternate" hreflang="x-default" href="https://letsylabs.com/">
<meta property="og:image" content="https://letsylabs.com/og/home-en.png">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"SoftwareApplication"}</script>
`;

describe('isHomePage', () => {
  it('recognizes both locale home files', () => {
    expect(isHomePage('index.html')).toBe(true);
    expect(isHomePage(path.join('es', 'index.html'))).toBe(true);
  });

  it('rejects every other page', () => {
    expect(isHomePage(path.join('voice', 'index.html'))).toBe(false);
  });
});

describe('findSeoProblems', () => {
  it('returns no problems for a valid non-home page', () => {
    expect(findSeoProblems(VALID_HEAD, false)).toEqual([]);
  });

  it('returns no problems for a valid home page (with correct JSON-LD)', () => {
    expect(findSeoProblems(VALID_HOME_HEAD, true)).toEqual([]);
  });

  it('flags a missing title', () => {
    const html = VALID_HEAD.replace('<title>Voice — letsylabs</title>', '');
    expect(findSeoProblems(html, false)).toContain('missing or empty <title>');
  });

  it('flags a missing description', () => {
    const html = VALID_HEAD.replace(/<meta name="description"[^>]*>/, '');
    expect(findSeoProblems(html, false)).toContain('missing or empty <meta name="description">');
  });

  it('flags a missing canonical link', () => {
    const html = VALID_HEAD.replace(/<link rel="canonical"[^>]*>/, '');
    expect(findSeoProblems(html, false)).toContain('missing <link rel="canonical">');
  });

  it('flags a relative (non-absolute) canonical href', () => {
    const html = VALID_HEAD.replace(
      '<link rel="canonical" href="https://letsylabs.com/voice">',
      '<link rel="canonical" href="/voice">',
    );
    expect(findSeoProblems(html, false)).toContain('canonical href is not absolute: "/voice"');
  });

  it('flags missing/incomplete hreflang (only 2 of 3)', () => {
    const html = VALID_HEAD.replace(
      '<link rel="alternate" hreflang="x-default" href="https://letsylabs.com/voice">',
      '',
    );
    const problems = findSeoProblems(html, false);
    expect(problems.some((p) => p.startsWith('expected hreflang en+es+x-default'))).toBe(true);
  });

  it('flags a relative hreflang href', () => {
    const html = VALID_HEAD.replace(
      '<link rel="alternate" hreflang="en" href="https://letsylabs.com/voice">',
      '<link rel="alternate" hreflang="en" href="/voice">',
    );
    expect(findSeoProblems(html, false)).toContain('hreflang href is not absolute: "/voice"');
  });

  it('flags a missing og:image', () => {
    const html = VALID_HEAD.replace(/<meta property="og:image"[^>]*>/, '');
    expect(findSeoProblems(html, false)).toContain('missing or empty <meta property="og:image">');
  });

  it('flags a non-home page that ships a JSON-LD script (home-only, CU-W8-1)', () => {
    const html = `${VALID_HEAD}<script type="application/ld+json">{}</script>`;
    expect(findSeoProblems(html, false).some((p) => p.includes('must have NO JSON-LD'))).toBe(true);
  });

  it('flags a home page with NO JSON-LD script', () => {
    const html = VALID_HOME_HEAD.replace(/<script type="application\/ld\+json">.*<\/script>/, '');
    expect(findSeoProblems(html, true).some((p) => p.includes('must have exactly 1 JSON-LD'))).toBe(
      true,
    );
  });

  it('flags a home page whose JSON-LD is not valid JSON', () => {
    const html = VALID_HOME_HEAD.replace(
      /<script type="application\/ld\+json">.*<\/script>/,
      '<script type="application/ld+json">{not valid json</script>',
    );
    expect(findSeoProblems(html, true).some((p) => p.includes('not valid JSON'))).toBe(true);
  });

  it('flags a home page whose JSON-LD @type is wrong', () => {
    const html = VALID_HOME_HEAD.replace('"@type":"SoftwareApplication"', '"@type":"WebSite"');
    expect(findSeoProblems(html, true).some((p) => p.includes('@type expected'))).toBe(true);
  });
});

describe('check_seo.mjs (CLI)', () => {
  let tmpDir;

  afterEach(() => {
    if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
  });

  function run(distDir) {
    return spawnSync('node', [checkSeoMjs, distDir], { encoding: 'utf8' });
  }

  it('passes (exit 0) for a dist with valid, unique-titled pages', () => {
    tmpDir = mkdtempSync(path.join(tmpdir(), 'check-seo-'));
    writeFileSync(path.join(tmpDir, 'index.html'), `<html><head>${VALID_HOME_HEAD}</head></html>`);
    mkdirSync(path.join(tmpDir, 'voice'));
    writeFileSync(
      path.join(tmpDir, 'voice', 'index.html'),
      `<html><head>${VALID_HEAD}</head></html>`,
    );
    const result = run(tmpDir);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('OK');
  });

  it('fails (exit 1) when two pages share the same <title>', () => {
    tmpDir = mkdtempSync(path.join(tmpdir(), 'check-seo-'));
    writeFileSync(path.join(tmpDir, 'index.html'), `<html><head>${VALID_HOME_HEAD}</head></html>`);
    mkdirSync(path.join(tmpDir, 'voice'));
    const duplicateTitleHead = VALID_HEAD.replace(
      '<title>Voice — letsylabs</title>',
      '<title>letsylabs — Realtime voice infrastructure</title>',
    );
    writeFileSync(
      path.join(tmpDir, 'voice', 'index.html'),
      `<html><head>${duplicateTitleHead}</head></html>`,
    );
    const result = run(tmpDir);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('is used by more than one page');
  });

  it('passes (exit 0) when the dist dir does not exist yet', () => {
    const result = run(path.join(tmpdir(), 'no-such-check-seo-dist'));
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('does not exist yet');
  });
});
