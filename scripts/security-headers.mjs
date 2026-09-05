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
 */
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

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
 * exception `scripts/check_third_party.sh` also knows about (D-W7-6).
 * @param {string | undefined} endpoint
 * @returns {string}
 */
export function buildHeaders(endpoint) {
  const origin = endpoint ? new URL(endpoint).origin : null;
  const connectSrc = ["'self'", origin].filter(Boolean).join(' ');
  const formAction = ["'self'", origin].filter(Boolean).join(' ');

  const csp = [
    "default-src 'self'",
    "script-src 'self'",
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
        const headersPath = fileURLToPath(new URL('_headers', dir));
        await writeFile(headersPath, buildHeaders(endpoint), 'utf8');
      },
    },
  };
}
