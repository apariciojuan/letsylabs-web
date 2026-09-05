import { describe, expect, it } from 'vitest';
import { findInlineScriptBodies, findInlineScripts, hashInlineScript } from './csp_hash.mjs';

describe('findInlineScripts', () => {
  it('returns the opening tag and body of an inline <script> (no src)', () => {
    expect(findInlineScripts('<script>alert(1)</script>')).toEqual([
      { tag: '<script>', body: 'alert(1)' },
    ]);
  });

  it('keeps attributes in the reported tag but ignores a <script src="...">', () => {
    const html = '<script src="/a.js"></script><script type="module">bad()</script>';
    expect(findInlineScripts(html)).toEqual([{ tag: '<script type="module">', body: 'bad()' }]);
  });
});

describe('findInlineScripts (non-JS <script> types, brief W-8 / D-W7-4)', () => {
  // CSP's script-src categorically does not govern a <script> element whose type is not empty, a JS
  // MIME essence match, or "module" (HTML "prepare the script element" / CSP3 script-like
  // definition) -- these types are DATA blocks, never executed, so `check_headers.mjs`'s hash
  // ratchet must not demand a hash for them. This is not an exception carved out for convenience (the
  // W-7b regression this repo fixed): it is what a real browser actually enforces.
  it('does NOT return a <script type="application/ld+json"> (JSON-LD structured data)', () => {
    const html = '<script type="application/ld+json">{"@type":"Thing"}</script>';
    expect(findInlineScripts(html)).toEqual([]);
  });

  it('does NOT return a <script type="application/json"> or other non-JS data type', () => {
    const html =
      '<script type="application/json">{}</script><script type="text/template">{{x}}</script>';
    expect(findInlineScripts(html)).toEqual([]);
  });

  it('DOES return a <script type="module"> (still executable JavaScript)', () => {
    const html = '<script type="module">bad()</script>';
    expect(findInlineScripts(html)).toEqual([{ tag: '<script type="module">', body: 'bad()' }]);
  });

  it('DOES return a <script> with no type attribute at all (defaults to JavaScript)', () => {
    expect(findInlineScripts('<script>alert(1)</script>')).toEqual([
      { tag: '<script>', body: 'alert(1)' },
    ]);
  });

  it('DOES return a <script type="text/javascript"> (explicit JS MIME type)', () => {
    const html = '<script type="text/javascript">ok()</script>';
    expect(findInlineScripts(html)).toEqual([
      { tag: '<script type="text/javascript">', body: 'ok()' },
    ]);
  });
});

describe('findInlineScriptBodies', () => {
  it('returns the body of an inline <script> (no src)', () => {
    expect(findInlineScriptBodies('<script>alert(1)</script>')).toEqual(['alert(1)']);
  });

  it('ignores a <script src="...">', () => {
    expect(findInlineScriptBodies('<script type="module" src="/a.js"></script>')).toEqual([]);
  });

  it('returns only the inline one when a page has one of each', () => {
    const html = '<script src="/a.js"></script><script>bad()</script>';
    expect(findInlineScriptBodies(html)).toEqual(['bad()']);
  });

  it('returns every inline script body in document order', () => {
    const html = '<script>one()</script><script>two()</script>';
    expect(findInlineScriptBodies(html)).toEqual(['one()', 'two()']);
  });
});

describe('hashInlineScript', () => {
  it('matches the known sha256 CSP hash for an empty script body', () => {
    // echo -n '' | openssl dgst -sha256 -binary | openssl base64
    expect(hashInlineScript('')).toBe('sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=');
  });

  it("matches node:crypto's own sha256/base64 digest for a known body", () => {
    // Precomputed once with node:crypto directly (not re-derived from the function under test):
    // createHash('sha256').update("console.log('hi')", 'utf8').digest('base64').
    expect(hashInlineScript("console.log('hi')")).toBe(
      'sha256-1ohZFo3B9w3UOFBbfx6JSomkpkME90iPs1r/qXzvX7Y=',
    );
  });

  it('produces different hashes for different bodies', () => {
    expect(hashInlineScript('a()')).not.toBe(hashInlineScript('b()'));
  });
});
