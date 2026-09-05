// @ts-check
/**
 * Vite plugin (brief W-7, spec D-W7-6): a honest, minimal mock of Formspree's own response shape,
 * mounted ONLY under `astro dev` (`apply: 'serve'` in astro.config.mjs -- never in `astro build`,
 * so it never ships in `dist/`). Lets `EarlyAccessForm`'s real fetch/FormData/JSON code path run
 * end to end in dev and in the `e2e` compose profile (which drives Playwright against the `web`
 * dev server) without a real Formspree account -- `compose.dev.yml`'s `web` service sets
 * `PUBLIC_WAITLIST_ENDPOINT=/__dev/waitlist` so `EarlyAccessForm.astro` renders the real `<form>`.
 *
 * Contract (matches Formspree's documented behavior closely enough for the e2e battery, CU-W7-1/4):
 * - `POST /__dev/waitlist` -> `200 {"ok":true}`.
 * - `POST /__dev/waitlist` with `email` starting with `fail@` -> `422 {"errors":[{"message":"..."}]}`.
 * - Any other HTTP method -> `405`.
 * `handleWaitlistRequest` is exported so `waitlist-mock.test.mjs` can exercise the logic directly
 * against fake Node `IncomingMessage`/`ServerResponse`-shaped objects, without spinning up Vite.
 */

export const WAITLIST_MOCK_PATH = '/__dev/waitlist';

/**
 * Reads and parses a `multipart/form-data` (or urlencoded) body's `email` field well enough for the
 * mock's one decision (does it start with "fail@"?) -- a real multipart parser is overkill for a
 * dev-only fixture; a simple substring search on the raw body is enough because the field name
 * ("email") is unique to this form and Formspree/FormData bodies always contain the field's raw
 * value verbatim (no additional encoding of the value itself in either encoding).
 */
/**
 * @param {string} rawBody
 * @returns {string}
 */
export function extractEmail(rawBody) {
  const match = rawBody.match(/name="email"\r?\n\r?\n([^\r\n]*)/);
  if (match) return match[1];
  // application/x-www-form-urlencoded fallback (no-JS native POST also works with this encoding).
  const params = new URLSearchParams(rawBody);
  return params.get('email') ?? '';
}

/**
 * Pure: decides the mock's status/body for a given method + raw request body.
 * @param {string} method
 * @param {string} rawBody
 * @returns {{ status: number, body: { ok: true } | { errors: { message: string }[] } }}
 */
export function handleWaitlistRequest(method, rawBody) {
  if (method !== 'POST') {
    return { status: 405, body: { errors: [{ message: 'mock: method not allowed' }] } };
  }
  const email = extractEmail(rawBody ?? '');
  if (email.startsWith('fail@')) {
    return { status: 422, body: { errors: [{ message: 'mock: rejected' }] } };
  }
  return { status: 200, body: { ok: true } };
}

/**
 * A minimal structural type for the one Vite dev-server API this plugin uses -- avoids importing
 * `vite`'s own types (not a direct dependency of this package; Astro depends on it transitively).
 * @typedef {{
 *   middlewares: {
 *     use: (
 *       path: string,
 *       handler: (req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse) => void,
 *     ) => void,
 *   },
 * }} MinimalViteDevServer
 */

/** @returns {{ name: string, apply: 'serve', configureServer: (server: MinimalViteDevServer) => void }} */
export function waitlistMockPlugin() {
  return {
    name: 'waitlist-mock',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(WAITLIST_MOCK_PATH, (req, res) => {
        /** @type {Buffer[]} */
        const chunks = [];
        req.on('data', (/** @type {Buffer} */ chunk) => chunks.push(chunk));
        req.on('end', () => {
          const rawBody = Buffer.concat(chunks).toString('utf8');
          const { status, body } = handleWaitlistRequest(req.method ?? '', rawBody);
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(body));
        });
      });
    },
  };
}
