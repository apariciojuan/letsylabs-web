/**
 * Route data shared by SiteNav and SiteFooter: the sitemap from
 * design_handoff_letsylabs_web/letsylabs_web_spec_diseno.md §3, expressed as English-canonical
 * (unprefixed) paths -- `localizePath()` (src/i18n/routing.ts) maps them to `/es/...` for the
 * Spanish nav/footer.
 *
 * `/compliance` (brief W-5): the user's routing decision (2026-09-05) confirmed EN canonical at the
 * bare path, `/es/compliance` for Spanish -- the SAME convention as every other page, no ES-first
 * exception. This module already treated it that way while the decision was still pending (see the
 * W-2 report); this comment just drops the "pending" framing now that W-5 has built the actual
 * pages on that footing.
 */

export const ROUTES = {
  voice: '/voice',
  telephony: '/telephony',
  compliance: '/compliance',
  selfHost: '/self-host',
  openSource: '/open-source',
  pricing: '/pricing',
  company: '/company',
  // Minimal legal pages (brief W-7, spec D-W7-3): exist so the footer never links to `#`/a 404, and
  // so `scripts/check_placeholders.mjs` watches their `{PRIVACY_POLICY}`/`{TERMS}` holes until the
  // real legal text (🔴 flecos) replaces them. Not part of any SiteNav section (navSectionFor below
  // deliberately does not classify them -- they are LEGAL footer links, not a top-level section).
  privacy: '/privacy',
  terms: '/terms',
} as const;

export type NavSection = 'product' | 'developers' | 'pricing' | 'company';

const PRODUCT_PATHS: readonly string[] = [
  ROUTES.voice,
  ROUTES.telephony,
  ROUTES.compliance,
  ROUTES.selfHost,
];

/**
 * Classifies an English-canonical (unprefixed) pathname into the top-level SiteNav section it
 * belongs to, or null when it matches none (e.g. the homepage, or a page outside the sitemap).
 * Callers pass `stripLocalePrefix(Astro.url.pathname)` so /es/voice and /voice both resolve to
 * 'product'.
 */
export function navSectionFor(pathname: string): NavSection | null {
  if (PRODUCT_PATHS.includes(pathname)) return 'product';
  if (pathname === ROUTES.openSource) return 'developers';
  if (pathname === ROUTES.pricing) return 'pricing';
  if (pathname === ROUTES.company) return 'company';
  return null;
}

/**
 * The i18n key for the header/hero CTA label, per the `PUBLIC_GA_LAUNCHED` build-time flag (README
 * §Botones: "Estado del CTA global: pre-GA 'Get early access'; post-GA 'Start building'"). A pure
 * function so the true/false branching is unit-testable without needing to fake Vite's
 * `import.meta.env` at test time -- SiteNav.astro/the CTA-consuming pages just call
 * `t(locale, ctaLabelKey(gaLaunched))`.
 */
export function ctaLabelKey(gaLaunched: boolean): 'nav.ctaPostGa' | 'nav.ctaPreGa' {
  return gaLaunched ? 'nav.ctaPostGa' : 'nav.ctaPreGa';
}
