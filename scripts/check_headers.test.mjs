import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { findInlineScriptTags, findMissingHeaderDirectives } from './check_headers.mjs';

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

describe('findInlineScriptTags', () => {
  it('flags a <script> with no src attribute', () => {
    const found = findInlineScriptTags('<script>alert(1)</script>');
    expect(found).toEqual(['<script>']);
  });

  it('ignores a <script src="...">', () => {
    expect(findInlineScriptTags('<script type="module" src="/a.js"></script>')).toEqual([]);
  });

  it('finds both when a page has one of each', () => {
    const html = '<script src="/a.js"></script><script>bad()</script>';
    expect(findInlineScriptTags(html)).toEqual(['<script>']);
  });

  // Astro's own client-hydration bootstrap (dispatches `astro:load` for `client:*`-directive
  // islands) is ALWAYS emitted as a literal inline <script> by Astro core -- no supported
  // Astro/Vite option externalizes it, unlike every other script in this repo (forced external by
  // astro.config.mjs's `assetsInlineLimit: 0`). It is the one documented exception.
  it("does NOT flag Astro's own client-hydration bootstrap script", () => {
    const html =
      '<script>(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).load=e;window.dispatchEvent(new Event("astro:load"));})();</script>';
    expect(findInlineScriptTags(html)).toEqual([]);
  });

  it('still flags a DIFFERENT inline script that merely mentions "Astro" in passing', () => {
    const html = '<script>console.log("hello from Astro")</script>';
    expect(findInlineScriptTags(html)).toEqual(['<script>']);
  });

  // Second Astro-core script, discovered while implementing D-W7-4: the <astro-island> custom
  // element definition, ALSO always inlined by Astro core for any page hydrating a client:*
  // island (this repo's homepage, via PipelineDiagramInteractive's client:load, brief W-3).
  // Bug found while implementing D-W7-4: the fingerprint used `.` (which never matches a newline
  // without the `s`/dotAll flag) between "self.Astro" and "astro:load" -- the real minified build
  // output is single-line so this passed there, but Prettier reformats the "OK" fixture (and any
  // hand-authored copy of this snippet) across several lines, which the un-fixed regex missed.
  // Rojo-antes: this exact multi-line body used to come back as a false positive (flagged as an
  // offender); verde-después with the `s` flag added to the fingerprint.
  it('recognizes the client-hydration bootstrap even reformatted across multiple lines', () => {
    const html = `<script>
      (() => {
        var e = async (t) => {
          await (await t())();
        };
        (self.Astro || (self.Astro = {})).load = e;
        window.dispatchEvent(new Event('astro:load'));
      })();
    </script>`;
    expect(findInlineScriptTags(html)).toEqual([]);
  });

  it('does NOT flag the <astro-island> custom element definition', () => {
    const html =
      '<script>customElements.get("astro-island")||customElements.define("astro-island",class extends HTMLElement{})</script>';
    expect(findInlineScriptTags(html)).toEqual([]);
  });
});

describe('check_headers.mjs (CLI, CU-W7-5)', () => {
  it('passes (exit 0) when _headers is complete and every <script> has a src', () => {
    const result = run('fixtures/dist_headers_ok');
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('OK');
  });

  it('fails (exit 1) when dist/_headers is missing entirely', () => {
    const result = run('fixtures/dist_headers_missing');
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("_headers' is missing");
  });

  it('fails (exit 1) when an HTML file ships an inline <script> (no src)', () => {
    const result = run('fixtures/dist_inline_script');
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("inline <script> tag(s) violate script-src 'self'");
  });

  it('passes (exit 0) when the dist dir does not exist yet', () => {
    const result = run('fixtures/no_such_dist_dir');
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('does not exist yet');
  });
});
