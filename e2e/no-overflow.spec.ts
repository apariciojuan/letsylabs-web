import { expect, test } from '@playwright/test';
import { SITE_PATHS } from '../src/lib/site-routes.ts';
import { locales } from '../src/i18n/index.ts';
import { localizePath } from '../src/i18n/routing.ts';

// Brief W-1 entregable 4 / RWD breakpoints from the handoff README (§Técnica): 380 (mobile),
// 768 (tablet), 1200 (desktop). No page should force horizontal scroll at any of them.
const breakpoints = [380, 768, 1200];

// Brief W-8: derived from `src/lib/site-routes.ts` (the single source of truth also used by
// sitemap.xml/robots.txt) instead of a hand-maintained list, so a new page added there is swept into
// this suite automatically rather than silently skipped until someone remembers to add it here too.
// '/dev/components' is kept as one extra manual entry: it is the dev-only QA harness (never a real
// route, so it is deliberately NOT in site-routes.ts) that mounts SiteNav/SiteFooter/PipelineDiagram
// together, where a shared-component responsive regression would actually show up first.
// The 8 product pages (W-4) each carry a wide table (/voice use-cases, /self-host comparison) and a
// wrapping node row (/self-host "audio never leaves") that must stay inside their own
// overflow-x:auto container at 380px, never force the document itself to scroll horizontally.
// /pricing (W-6) is the one page whose layout changes with PUBLIC_GA_LAUNCHED: only the default
// (pre-GA) build is covered here, same as every other suite (CU-W6-1, no second build in the
// battery -- see PricingPage.test.ts for both states).
// /compliance (W-5) has the widest single card row of any interior page (the flex-wrap Export
// section, 380px/400px basis columns) -- must still stay inside its own container at 380px.
const pages = [
  ...SITE_PATHS.flatMap((path) => locales.map((locale) => localizePath(path, locale))),
  '/dev/components',
];

for (const width of breakpoints) {
  for (const path of pages) {
    test(`no horizontal overflow at ${width}px on ${path}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      const overflows = await page.evaluate(() => {
        const root = document.documentElement;
        return root.scrollWidth > root.clientWidth;
      });
      expect(overflows).toBe(false);
    });
  }
}
