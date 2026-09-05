/**
 * `robots.txt` endpoint (brief W-8): thin wrapper around `src/lib/robots.ts`'s pure `buildRobotsTxt`
 * -- see that module's doc comment for why the actual logic (and its test) lives there instead of
 * here.
 */
import type { APIRoute } from 'astro';
import { siteOrigin } from '../lib/seo';
import { buildRobotsTxt } from '../lib/robots';

export const GET: APIRoute = ({ site }) => {
  const body = buildRobotsTxt(siteOrigin(site));
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
