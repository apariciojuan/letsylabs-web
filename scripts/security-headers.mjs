// @ts-check
/**
 * Astro integration (brief W-7, spec D-W7-4): writes `dist/_headers` (the Netlify/Cloudflare Pages
 * convention -- README documents the equivalent nginx snippet as an alternative for other hosts) at
 * `astro:build:done`, and fails `astro build` (never `astro dev` -- see the `command` guard below)
 * if `PUBLIC_WAITLIST_ENDPOINT` is set to anything other than empty or an absolute `https://` URL. A
 * `<form>` posting to a broken relative path in production would be a stub (CLAUDE.md §4.1); the dev
 * server intentionally uses a relative mock endpoint (`/__dev/waitlist`, `compose.dev.yml`), which is
 * exactly why this only runs for the `build` command. The guard runs in `astro:config:setup` (the
 * only integration hook whose options carry `command` -- `astro:config:done`'s do not, per Astro's
 * own `HookParameters` types), which fires early enough to fail the build before any page renders.
 *
 * `endpoint` is passed in from `astro.config.mjs` (which reads `process.env.PUBLIC_WAITLIST_ENDPOINT`
 * -- Docker Compose's `env_file`/`environment` already put it there before Node even starts) rather
 * than read from `process.env` inside this module, so `security-headers.test.mjs` can call
 * `buildHeaders`/`validateEndpoint` directly with any value.
 *
 * W-7b: `script-src 'self'` alone silently no-op's the two inline `<script>` elements Astro's own
 * core ALWAYS emits on any page that hydrates a `client:*`-directive island (the client-hydration
 * bootstrap and the `<astro-island>` custom element definition -- this repo's homepage has one such
 * island, `PipelineDiagramInteractive`, brief W-3). Rather than `'unsafe-inline'` (would defeat the
 * policy) this integration hashes every inline script actually shipped in `dist/` at
 * `astro:build:done` (after all HTML is written) and adds each `'sha256-...'` to `script-src`, so
 * whatever Astro emits -- today's two core scripts, or a different set after some future Astro
 * upgrade -- is exactly and only what the policy allows. Hashing is shared with the ratchet
 * (`check_headers.mjs`) via `csp_hash.mjs` so the two can never compute different hashes for the
 * same script (CLAUDE.md §8.3, DRY).
 */
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findInlineScriptBodies, hashInlineScript } from './csp_hash.mjs';

/**
 * Recursively lists every `.html` file under `dir`.
 * @param {string} dir
 * @returns {Promise<string[]>}
 */
async function listHtmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return listHtmlFiles(fullPath);
      if (entry.isFile() && entry.name.endsWith('.html')) return [fullPath];
      return [];
    }),
  );
  return nested.flat();
}

/**
 * Walks every `.html` file under `distDir` and returns the sorted, deduplicated `'sha256-...'`
 * sources for every inline `<script>` the build actually shipped. Sorted so that two builds with
 * the exact same inline scripts always produce byte-identical `_headers` (determinism, CLAUDE.md
 * §6.5) regardless of directory-listing or file-processing order.
 * @param {string} distDir
 * @returns {Promise<string[]>}
 */
export async function collectInlineScriptHashes(distDir) {
  const files = await listHtmlFiles(distDir);
  const hashes = new Set();
  for (const file of files) {
    const html = await readFile(file, 'utf8');
    for (const body of findInlineScriptBodies(html)) {
      hashes.add(hashInlineScript(body));
    }
  }
  return [...hashes].sort();
}

/**
 * Pure: returns `null` when `value` is a valid endpoint configuration (undefined/empty string =
 * fail-closed mailto-only mode, D-W7-1), or a human-readable error message otherwise.
 * @param {string | undefined} value
 * @returns {string | null}
 */
export function validateEndpoint(value) {
  if (value === undefined || value === '') return null;

  let url;
  try {
    url = new URL(value);
  } catch {
    return `PUBLIC_WAITLIST_ENDPOINT must be a valid absolute URL, got: "${value}"`;
  }
  if (url.protocol !== 'https:') {
    return `PUBLIC_WAITLIST_ENDPOINT must use https://, got: "${value}"`;
  }
  return null;
}

/**
 * Pure: builds the exact `dist/_headers` file content for D-W7-4's policy. `endpoint`'s origin (when
 * present) is the one extra allowed source in `connect-src`/`form-action` -- the single explicit
 * exception `scripts/check_third_party.sh` also knows about (D-W7-6). `scriptHashes` (W-7b) is the
 * sorted, deduplicated `'sha256-...'` list `collectInlineScriptHashes` computed from the actual
 * built HTML -- every one of them is appended to `script-src` alongside `'self'` so a real browser
 * does not silently block Astro's own inline island-hydration scripts.
 * @param {string | undefined} endpoint
 * @param {string[]} [scriptHashes]
 * @returns {string}
 */
export function buildHeaders(endpoint, scriptHashes = []) {
  const origin = endpoint ? new URL(endpoint).origin : null;
  const connectSrc = ["'self'", origin].filter(Boolean).join(' ');
  const formAction = ["'self'", origin].filter(Boolean).join(' ');
  const scriptSrc = ["'self'", ...scriptHashes.map((hash) => `'${hash}'`)].join(' ');

  const csp = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src ${connectSrc}`,
    `form-action ${formAction}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
    'upgrade-insecure-requests',
  ].join('; ');

  return (
    [
      '/*',
      `  Content-Security-Policy: ${csp}`,
      '  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload',
      '  X-Content-Type-Options: nosniff',
      '  X-Frame-Options: DENY',
      '  Referrer-Policy: strict-origin-when-cross-origin',
      '  Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()',
    ].join('\n') + '\n'
  );
}

/**
 * @param {{ endpoint?: string }} [options]
 * @returns {import('astro').AstroIntegration}
 */
export function securityHeaders(options = {}) {
  const { endpoint } = options;
  return {
    name: 'security-headers',
    hooks: {
      /** @param {{ command: 'dev' | 'build' | 'preview' | 'sync' }} params */
      'astro:config:setup': ({ command }) => {
        // Only `astro build` is guarded -- `astro dev` legitimately runs with a relative mock
        // endpoint (D-W7-6), and this hook fires for every command Astro runs.
        if (command !== 'build') return;
        const error = validateEndpoint(endpoint);
        if (error) {
          throw new Error(
            `security-headers: ${error} (CLAUDE.md §4.1: a form posting nowhere real is a stub)`,
          );
        }
      },
      /** @param {{ dir: URL }} params */
      'astro:build:done': async ({ dir }) => {
        // Every HTML file is already written to disk by the time this hook fires (astro:build:done
        // is the LAST build hook), so this sees exactly what a browser will receive -- including
        // Astro's own inline island-hydration scripts.
        const distDir = fileURLToPath(dir);
        const scriptHashes = await collectInlineScriptHashes(distDir);
        const headersPath = path.join(distDir, '_headers');
        await writeFile(headersPath, buildHeaders(endpoint, scriptHashes), 'utf8');
      },
    },
  };
}
