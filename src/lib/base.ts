/**
 * Deploy base path helpers (Astro's `base` option, driven by `PUBLIC_BASE_PATH` in
 * `astro.config.mjs`). A root deploy (the production domain, the dev server, every ratchet) has an
 * empty base and every helper here is the identity. A GitHub Pages *project* site is served under
 * `/<repo>/` instead: Vite already rewrites bundled assets (`/_astro/*`) and CSS `url()` references
 * into `public/` with the base, but Astro does NOT touch `href`/`src` attributes hand-written in
 * `.astro` templates or strings built in TS (nav links, locale switch, hreflang, OG image, font
 * preloads, favicon, sitemap/robots) -- those go through `withBase`, and anything that parses
 * `Astro.url.pathname` (which DOES include the base at build time) goes through `stripBase` first.
 *
 * Read from `import.meta.env.BASE_URL` (Astro/Vite; `/` when no base is configured) with a guard so
 * the plain-`node` ratchets that import `seo.ts`/`routing.ts` (no `import.meta.env` at all) resolve
 * to root, exactly like the root `dist/` they check.
 */

/** `'/'`, `''` and `undefined` mean root (no prefix); anything else becomes `/segment` with no trailing slash. */
export function normalizeBase(raw: string | undefined): string {
  const trimmed = (raw ?? '').replace(/^\/+/, '').replace(/\/+$/, '');
  return trimmed === '' ? '' : `/${trimmed}`;
}

/** The normalized base of the current build: `''` for a root deploy, `/letsylabs-web` on a project page. */
export const basePath: string = normalizeBase(import.meta.env?.BASE_URL);

/** Prefixes a root-absolute `pathname` (must start with `/`) with the deploy base. */
export function withBase(pathname: string, base: string = basePath): string {
  return `${base}${pathname}`;
}

/** Removes the deploy base from a pathname that carries it (e.g. `Astro.url.pathname`); other paths pass through. */
export function stripBase(pathname: string, base: string = basePath): string {
  if (base === '') return pathname;
  if (pathname === base) return '/';
  if (pathname.startsWith(`${base}/`)) return pathname.slice(base.length);
  return pathname;
}
