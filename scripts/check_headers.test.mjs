import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  extractScriptSrcSources,
  findMissingHeaderDirectives,
  findUnhashedInlineScripts,
} from './check_headers.mjs';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const checkHeadersMjs = path.join(scriptsDir, 'check_headers.mjs');

function run(fixtureDirRelativePath) {
  const fixtureDir = path.join(scriptsDir, fixtureDirRelativePath);
  return spawnSync('node', [checkHeadersMjs, fixtureDir], { encoding: 'utf8' });
}

describe('findMissingHeaderDirectives', () => {
  it('reports every missing fragment for an incomplete policy', () => {
    const missing = findMissingHeaderDirectives(
      "/*\n  Content-Security-Policy: default-src 'self'\n",
    );
    expect(missing).toContain("script-src 'self'");
    expect(missing).toContain(
      'Strict-Transport-Security: max-age=63072000; includeSubDomains; preload',
    );
  });

  it('returns an empty array for a complete policy', () => {
    expect(
      findMissingHeaderDirectives(`
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'self'; object-src 'none'; upgrade-insecure-requests
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
`),
    ).toEqual([]);
  });
});

describe('extractScriptSrcSources', () => {
  it('returns every source expression in the script-src directive', () => {
    const headers =
      "Content-Security-Policy: default-src 'self'; script-src 'self' 'sha256-AAA=' 'sha256-BBB='; style-src 'self'";
    expect(extractScriptSrcSources(headers)).toEqual(["'self'", "'sha256-AAA='", "'sha256-BBB='"]);
  });

  it('returns an empty array when script-src is absent', () => {
    expect(extractScriptSrcSources("Content-Security-Policy: default-src 'self'")).toEqual([]);
  });
});

describe('findUnhashedInlineScripts (W-7b, D-W7-4)', () => {
  // W-7b: the entry that relaxed this ratchet let ANY inline <script> whose body matched Astro's
  // own fingerprint through, regardless of whether `_headers`' script-src actually allowed it --
  // exactly what a real browser would refuse to execute under `script-src 'self'` with no hash.
  // The real guarantee is the hash, not where the script came from (brief W-7b).
  it('flags an inline <script> whose hash is absent from script-src', () => {
    const html = '<script src="/a.js"></script><script>bad()</script>';
    const headers = "Content-Security-Policy: default-src 'self'; script-src 'self'";
    const offenders = findUnhashedInlineScripts(html, headers);
    expect(offenders).toHaveLength(1);
    expect(offenders[0]).toContain('<script>');
  });

  it('does NOT flag an inline <script> whose exact hash IS present in script-src', () => {
    const body = "console.log('csp-fixture-ok')";
    // Precomputed with node:crypto directly, same as csp_hash.test.mjs.
    const hash = 'sha256-Nem8LT4Ew/i+4hkY17s9enizT2HANjt/iJ31yDBprDw=';
    const html = `<script>${body}</script>`;
    const headers = `Content-Security-Policy: default-src 'self'; script-src 'self' '${hash}'`;
    expect(findUnhashedInlineScripts(html, headers)).toEqual([]);
  });

  it('never flags a <script src="..."> (external, outside the hash allowlist entirely)', () => {
    const html = '<script type="module" src="/a.js"></script>';
    const headers = "Content-Security-Policy: default-src 'self'; script-src 'self'";
    expect(findUnhashedInlineScripts(html, headers)).toEqual([]);
  });

  // W-7b: no more "Astro's own scripts are exempt" -- Astro's two core inline scripts (the
  // client-hydration bootstrap and the <astro-island> custom element definition) must now clear
  // the SAME hash check as any other inline script. Rojo-antes for this exact case is the CLI test
  // below (fixtures/dist_headers_ok used to pass via the fingerprint exception with no hash at
  // all in `_headers`).
  it("flags Astro's own client-hydration bootstrap when its hash is absent, same as any other script", () => {
    const html =
      '<script>(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).load=e;window.dispatchEvent(new Event("astro:load"));})();</script>';
    const headers = "Content-Security-Policy: default-src 'self'; script-src 'self'";
    expect(findUnhashedInlineScripts(html, headers)).toHaveLength(1);
  });
});

describe('check_headers.mjs (CLI, CU-W7-5)', () => {
  it("passes (exit 0) when _headers has every inline <script>'s hash, including Astro's own two core scripts", () => {
    const result = run('fixtures/dist_headers_ok');
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('OK');
  });

  it('fails (exit 1) when dist/_headers is missing entirely', () => {
    const result = run('fixtures/dist_headers_missing');
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("_headers' is missing");
  });

  it('fails (exit 1) when an HTML file ships an inline <script> whose hash is not in script-src', () => {
    const result = run('fixtures/dist_inline_script');
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("script-src 'self'");
  });

  it('passes (exit 0) when the dist dir does not exist yet', () => {
    const result = run('fixtures/no_such_dist_dir');
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('does not exist yet');
  });

  // W-7b ratchet fixtures, dedicated to the hash rule (as opposed to `dist_headers_ok`/
  // `dist_inline_script` above, which exercise the real Astro-core scripts).
  it('passes (exit 0) when the one inline <script> has its exact hash in script-src', () => {
    const result = run('fixtures/dist_script_hash_ok');
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('OK');
  });

  it("fails (exit 1, no fingerprint exception) when the SAME script's hash is missing from script-src", () => {
    const result = run('fixtures/dist_script_hash_missing');
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("script-src 'self'");
  });
});
