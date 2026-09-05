import { expect, test } from '@playwright/test';

// Brief W-5: `/compliance` (EN, canonical at the bare path) and `/es/compliance` (ES, the
// handoff's original copy) -- the "star" page. no-overflow coverage lives in no-overflow.spec.ts
// (extended for these 2 routes); this file covers routing/rendering, hreflang, no-JS content,
// LangSwitch, reduced-motion and the mandatory disclaimer.

const PAGES = [
  { path: '/compliance', h1: 'Comply with Ley 10/2025' },
  { path: '/es/compliance', h1: 'Cumple la Ley 10/2025' },
];

test.describe('/compliance responds and renders its H1', () => {
  for (const { path, h1 } of PAGES) {
    test(`${path} responds 200 and shows its H1`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.locator('main h1')).toContainText(h1, { ignoreCase: true });
    });
  }
});

test.describe('/compliance renders its content without JavaScript', () => {
  for (const { path, h1 } of PAGES) {
    test(`${path} shows its H1 and body copy with JS disabled`, async ({ browser }) => {
      const context = await browser.newContext({ javaScriptEnabled: false });
      const page = await context.newPage();
      await page.goto(path);
      await expect(page.locator('main h1')).toBeVisible();
      await expect(page.locator('main h1')).toContainText(h1, { ignoreCase: true });
      await context.close();
    });
  }

  test('/compliance shows the 4 law cards, the 6-event timeline and the illustrative export sample', async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/compliance');
    await expect(page.locator('.cmp-law-grid > .card')).toHaveCount(4);
    await expect(page.locator('[data-placeholder="ARTÍCULO"]').first()).toHaveText('{ARTÍCULO}');
    await expect(page.locator('.cmp-timeline-card .event-timeline-row')).toHaveCount(6);
    await expect(page.locator('.cmp-export-card-header .badge')).toHaveText('ILLUSTRATIVE');
    await expect(page.locator('.cmp-export-pre')).toContainText('"session"');
    await expect(page.locator('.cmp-faq-grid > .card')).toHaveCount(3);
    await context.close();
  });

  test('/compliance shows the mandatory disclaimer at the bottom, next to the mailto CTA', async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/compliance');
    const disclaimer = page.locator('.cmp-cta-disclaimer');
    await expect(disclaimer).toBeVisible();
    await expect(disclaimer).toContainText('This is not legal advice');
    const ctaLink = page.locator('.cmp-cta-inner a');
    await expect(ctaLink).toHaveAttribute('href', 'mailto:hello@letsylabs.com');
    await context.close();
  });

  test('/es/compliance shows the mandatory disclaimer, literal ES text from the handoff', async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/es/compliance');
    await expect(page.locator('.cmp-cta-disclaimer')).toContainText('No es asesoramiento jurídico');
    await context.close();
  });
});

test.describe('hreflang cross-references /compliance and /es/compliance', () => {
  // Brief W-8: hreflang hrefs are now ABSOLUTE (src/lib/seo.ts, rooted at PUBLIC_SITE_URL) rather
  // than the origin-relative paths this test used to assert -- see BaseLayout.test.ts and
  // e2e/hreflang.spec.ts for the general (site-wide) coverage of this.
  test('/compliance declares hreflang alternates pointing at itself and /es/compliance', async ({
    page,
  }) => {
    await page.goto('/compliance');
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
      'href',
      'https://letsylabs.com/compliance',
    );
    await expect(page.locator('link[rel="alternate"][hreflang="es"]')).toHaveAttribute(
      'href',
      'https://letsylabs.com/es/compliance',
    );
  });

  test('/es/compliance declares hreflang alternates pointing at itself and /compliance', async ({
    page,
  }) => {
    await page.goto('/es/compliance');
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
      'href',
      'https://letsylabs.com/compliance',
    );
    await expect(page.locator('link[rel="alternate"][hreflang="es"]')).toHaveAttribute(
      'href',
      'https://letsylabs.com/es/compliance',
    );
  });
});

test.describe('SiteNav marks /compliance under "Product"', () => {
  test('/compliance highlights "Product"', async ({ page }) => {
    await page.goto('/compliance');
    // "Product" is a mega-menu trigger `<button>`, not a plain `<a>` (see SiteNav.astro) --
    // same selector used by product-pages.spec.ts for /voice, /telephony, /self-host.
    await expect(page.locator('.nav-product-trigger')).toHaveClass(/is-active/);
  });
});

test.describe('LangSwitch preserves the route on /compliance', () => {
  test('/compliance -> /es/compliance and back', async ({ page }) => {
    await page.goto('/compliance');
    await page.getByRole('link', { name: 'ES', exact: true }).first().click();
    await expect(page).toHaveURL(/\/es\/compliance\/?$/);
    await page.getByRole('link', { name: 'EN', exact: true }).first().click();
    await expect(page).toHaveURL(/\/compliance\/?$/);
  });
});

test.describe('reduced-motion on /compliance', () => {
  test('the timeline rows and law cards are visible without scrolling, no reveal needed', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/compliance');
    const reveals = page.locator('[data-reveal]');
    const count = await reveals.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(reveals.nth(i)).toBeVisible();
    }
  });
});
