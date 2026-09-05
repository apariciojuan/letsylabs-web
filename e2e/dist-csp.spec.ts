import { existsSync, readFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

// Brief W-7b (D-W7-4): verifies the homepage actually works under the REAL policy the site ships
// with, not a synthetic approximation. `astro dev` (this repo's other e2e specs' target, via
// PLAYWRIGHT_BASE_URL) never writes `dist/_headers` and its inline-script content can differ from
// the production build's -- injecting a header derived from `dist/` while navigating the dev
// server would not actually prove anything about `dist/_headers`. Instead, this spec serves the
// real `dist/` output over HTTP with the real `_headers` policy applied to every response (exactly
// what a static host like Netlify/Cloudflare Pages does), then confirms in a real browser that (a)
// the homepage's `client:load` island still hydrates -- the same interaction `home.spec.ts` proves
// against the dev server -- and (b) the browser logs zero CSP violations. Requires `dist/` to
// already exist (`pnpm build` before `pnpm e2e`, same as `headers:check`/`placeholders:check`).

const distDir = fileURLToPath(new URL('../dist/', import.meta.url));

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon',
};

/**
 * Parses `scripts/security-headers.mjs`'s own `_headers` output (a single `/*` block, one
 * `  Key: value` line per header) into a plain header map.
 */
function parseHeadersFile(content: string): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const match = /^ {2}([^:]+):\s*(.+)$/.exec(line);
    if (match) headers[match[1]] = match[2];
  }
  return headers;
}

function resolveFile(pathname: string): string | null {
  const clean = decodeURIComponent(pathname.split('?')[0] ?? '/');
  if (clean.includes('..')) return null;
  const candidates = clean.endsWith('/')
    ? [path.join(distDir, clean, 'index.html')]
    : [
        path.join(distDir, clean),
        path.join(distDir, `${clean}.html`),
        path.join(distDir, clean, 'index.html'),
      ];
  for (const candidate of candidates) {
    if (existsSync(candidate) && candidate.startsWith(distDir)) return candidate;
  }
  return null;
}

function startDistServer(): Promise<{ server: Server; baseURL: string }> {
  const headersPath = path.join(distDir, '_headers');
  if (!existsSync(headersPath)) {
    throw new Error(`${headersPath} is missing -- run "pnpm build" before this spec (W-7b).`);
  }
  const headers = parseHeadersFile(readFileSync(headersPath, 'utf8'));

  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      for (const [name, value] of Object.entries(headers)) res.setHeader(name, value);
      const file = resolveFile(req.url ?? '/');
      if (!file) {
        res.writeHead(404).end('Not found');
        return;
      }
      res.setHeader('Content-Type', MIME_TYPES[path.extname(file)] ?? 'application/octet-stream');
      res.writeHead(200).end(readFileSync(file));
    });
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (address === null || typeof address === 'string') {
        reject(new Error('failed to bind the dist/ test server'));
        return;
      }
      resolve({ server, baseURL: `http://127.0.0.1:${address.port}` });
    });
  });
}

test.describe('dist/ served with the real D-W7-4 CSP headers (W-7b)', () => {
  let server: Server;
  let baseURL: string;

  test.beforeAll(async () => {
    ({ server, baseURL } = await startDistServer());
  });

  test.afterAll(() => {
    server.close();
  });

  test('the homepage island hydrates and the browser logs zero CSP violations', async ({
    page,
  }) => {
    const cspViolations: string[] = [];
    page.on('console', (message) => {
      const text = message.text();
      if (/content security policy|refused to (execute|load)/i.test(text)) {
        cspViolations.push(text);
      }
    });

    await page.goto(`${baseURL}/`);
    await page.waitForLoadState('networkidle');

    // Same real-homepage interaction as e2e/home.spec.ts's "pipeline re-routing" describe block --
    // proves the client:load island actually hydrated under the real headers, not just that the
    // static markup loaded.
    const browserSource = page.getByTestId('pipeline-source-browser');
    const ollama = page.getByTestId('pipeline-destination-ollama');

    await browserSource.click();
    await ollama.click();

    await expect(browserSource).toHaveAttribute('aria-pressed', 'true');
    await expect(ollama).toHaveAttribute('aria-pressed', 'true');

    expect(cspViolations).toEqual([]);
  });
});
