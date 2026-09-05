/**
 * Route data shared by SiteNav and SiteFooter: the sitemap from
 * design_handoff_letsylabs_web/letsylabs_web_spec_diseno.md §3, expressed as English-canonical
 * (unprefixed) paths -- `localizePath()` (src/i18n/routing.ts) maps them to `/es/...` for the
 * Spanish nav/footer.
 *
 * None of these pages exist yet (W-3/W-4/W-5/W-6 build them); Astro does not validate link targets
 * at build time, so linking to them now is safe. Pending per the W-2 brief and
 * docs/plans/web/00_plan_web.md W-5.1: `/compliance` is expected to become an ES-first exception
 * (ES canonical at the bare path, EN at `/en/compliance`) once that routing convention is
 * confirmed -- until then this module (and therefore SiteNav/SiteFooter) treats it like every other
 * page (EN canonical, `/es/compliance` for Spanish). Flagged in task-W-2-report.md.
 */

export const ROUTES = {
  voice: '/voice',
  telephony: '/telephony',
  compliance: '/compliance',
  selfHost: '/self-host',
  openSource: '/open-source',
  pricing: '/pricing',
  company: '/company',
} as const;

export type NavSection = 'product' | 'developers' | 'pricing' | 'company';

const PRODUCT_PATHS: readonly string[] = [ROUTES.voice, ROUTES.telephony, ROUTES.compliance, ROUTES.selfHost];

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
