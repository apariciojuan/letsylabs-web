import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { buildHeaders, securityHeaders, validateEndpoint } from './security-headers.mjs';

describe('validateEndpoint (D-W7-4 build guard)', () => {
  it('accepts undefined and the empty string (fail-closed mailto-only mode, D-W7-1)', () => {
    expect(validateEndpoint(undefined)).toBeNull();
    expect(validateEndpoint('')).toBeNull();
  });

  it('accepts an absolute https:// URL', () => {
    expect(validateEndpoint('https://formspree.io/f/abcd1234')).toBeNull();
  });

  it('rejects a relative path (would be a stub in production, CLAUDE.md §4.1)', () => {
    expect(validateEndpoint('/__dev/waitlist')).toMatch(/must be a valid absolute URL/);
  });

  it('rejects http:// (insecure)', () => {
    expect(validateEndpoint('http://formspree.io/f/abcd1234')).toMatch(/must use https:\/\//);
  });

  it('rejects a malformed URL', () => {
    expect(validateEndpoint('not a url')).toMatch(/must be a valid absolute URL/);
  });
});

describe('buildHeaders (D-W7-4)', () => {
  it('without an endpoint, connect-src/form-action only allow self', () => {
    const headers = buildHeaders(undefined);
    expect(headers).toContain("connect-src 'self';");
    expect(headers).toContain("form-action 'self';");
    expect(headers).not.toContain("connect-src 'self' https");
  });

  it('with an endpoint, connect-src/form-action allow self + the endpoint origin (derived, not the full URL)', () => {
    const headers = buildHeaders('https://formspree.io/f/abcd1234');
    expect(headers).toContain("connect-src 'self' https://formspree.io;");
    expect(headers).toContain("form-action 'self' https://formspree.io;");
    expect(headers).not.toContain('/f/abcd1234');
  });

  it('always includes every mandatory directive from D-W7-4', () => {
    const headers = buildHeaders(undefined);
    for (const expected of [
      'Content-Security-Policy:',
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "object-src 'none'",
      'upgrade-insecure-requests',
      'Strict-Transport-Security: max-age=63072000; includeSubDomains; preload',
      'X-Content-Type-Options: nosniff',
      'X-Frame-Options: DENY',
      'Referrer-Policy: strict-origin-when-cross-origin',
      'Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()',
    ]) {
      expect(headers).toContain(expected);
    }
  });
});

describe('securityHeaders() integration', () => {
  let tmpDir;

  afterEach(async () => {
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true });
    tmpDir = undefined;
  });

  it('astro:config:setup does nothing for the "dev" command, even with an invalid endpoint', () => {
    const integration = securityHeaders({ endpoint: '/__dev/waitlist' });
    expect(() => integration.hooks['astro:config:setup']({ command: 'dev' })).not.toThrow();
  });

  it('astro:config:setup throws for the "build" command with an invalid endpoint', () => {
    const integration = securityHeaders({ endpoint: '/__dev/waitlist' });
    expect(() => integration.hooks['astro:config:setup']({ command: 'build' })).toThrow(
      /must be a valid absolute URL/,
    );
  });

  it('astro:config:setup does not throw for the "build" command with a valid (or empty) endpoint', () => {
    expect(() =>
      securityHeaders({ endpoint: undefined }).hooks['astro:config:setup']({ command: 'build' }),
    ).not.toThrow();
    expect(() =>
      securityHeaders({ endpoint: 'https://formspree.io/f/abcd' }).hooks['astro:config:setup']({
        command: 'build',
      }),
    ).not.toThrow();
  });

  it('astro:build:done writes dist/_headers with the built policy', async () => {
    tmpDir = await mkdtemp(path.join(tmpdir(), 'security-headers-'));
    const dir = pathToFileURL(tmpDir + path.sep);
    const integration = securityHeaders({ endpoint: 'https://formspree.io/f/abcd' });

    await integration.hooks['astro:build:done']({ dir });

    const content = await readFile(path.join(tmpDir, '_headers'), 'utf8');
    expect(content).toContain('Content-Security-Policy:');
    expect(content).toContain('https://formspree.io');
  });
});
