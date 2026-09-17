/**
 * Pure robots.txt body builder (brief W-8, entregable W8-1a). Split out of `src/pages/robots.txt.ts`
 * for the same reason as `src/lib/sitemap.ts` -- see that module's doc comment (every file under
 * `src/pages/` is a route to Astro, including a `*.test.ts` sitting next to the endpoint).
 *
 * `Allow: /` (everything indexable -- the dev-only QA page never ships, `astro.config.mjs`'s
 * `stripDevPages`) plus an absolute `Sitemap:` pointer, per the robots.txt spec
 * (https://www.rfc-editor.org/rfc/rfc9309), which requires the sitemap directive's URL to be
 * absolute.
 */
import { withBase } from './base.ts';

export function buildRobotsTxt(origin: string): string {
  return [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${origin}${withBase('/sitemap.xml')}`,
    '',
  ].join('\n');
}
