/**
 * `sitemap.xml` endpoint (brief W-8): thin wrapper around `src/lib/sitemap.ts`'s pure
 * `buildSitemapXml` -- see that module's doc comment for why the actual logic (and its test) lives
 * there instead of here (every file under `src/pages/` is a route to Astro, including a `*.test.ts`
 * sitting next to this one).
 */
import type { APIRoute } from 'astro';
import { siteOrigin } from '../lib/seo';
import { buildSitemapXml } from '../lib/sitemap';

export const GET: APIRoute = ({ site }) => {
  const body = buildSitemapXml(siteOrigin(site));
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
