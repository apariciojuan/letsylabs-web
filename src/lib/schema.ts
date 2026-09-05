/**
 * schema.org JSON-LD for the home page (brief W-8, entregable W8-1a): `SoftwareApplication`, per the
 * handoff/spec ("schema.org SoftwareApplication", README §Técnica). Home-page-only (`BaseLayout.astro`
 * only renders this when a page passes `jsonLd`) -- a marketing site describing one product doesn't
 * need per-page schema, and the spec only asks for this one type.
 *
 * `offers` is deliberately omitted (not `null`/an empty object): CLAUDE.md's honesty rule forbids
 * affirming pricing that doesn't exist yet (pre-GA, no public price), and `Offers` in schema.org is
 * itself a pricing claim -- omitting the field entirely is the honest state, not a placeholder value
 * inside it.
 */
// Explicit `index.ts` extension: see src/lib/seo.ts's doc comment (this module is also imported
// directly by plain-`node`-executed ratchet scripts).
import type { Locale } from '../i18n/index.ts';
import { t } from '../i18n/index.ts';

export interface SoftwareApplicationSchema {
  '@context': 'https://schema.org';
  '@type': 'SoftwareApplication';
  name: string;
  description: string;
  applicationCategory: string;
  operatingSystem: string;
  url: string;
  inLanguage: string;
}

/** Builds the home page's `SoftwareApplication` JSON-LD object for `locale`, rooted at `origin`. */
export function softwareApplicationSchema(
  locale: Locale,
  origin: string,
): SoftwareApplicationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'letsylabs',
    description: t(locale, 'home.meta.description'),
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Linux',
    url: locale === 'es' ? `${origin}/es/` : `${origin}/`,
    inLanguage: locale,
  };
}
