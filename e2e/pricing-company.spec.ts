import { expect, test } from '@playwright/test';

// Brief W-6: /pricing (default build == pre-GA, PUBLIC_GA_LAUNCHED unset) and /company, in EN and
// ES -- 4 routes total. Post-GA is covered only by PricingPage.test.ts (CU-W6-1: no second build in
// the e2e battery, per the brief's decision). no-overflow coverage lives in no-overflow.spec.ts
// (extended for these routes); this file covers routing/rendering, no-JS content, nav/LangSwitch
// integration.

const PAGES = [
  { path: '/pricing', h1: 'Pricing lands with GA' },
  { path: '/es/pricing', h1: 'Los precios llegan con el GA' },
  { path: '/company', h1: 'interaction layer between intelligent software' },
  { path: '/es/company', h1: 'capa de interacción entre el software inteligente' },
];

test.describe('pricing/company respond and render their H1', () => {
  for (const { path, h1 } of PAGES) {
    test(`${path} responds 200 and shows its H1`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.locator('main h1')).toContainText(h1, { ignoreCase: true });
    });
  }
});

test.describe('pricing/company render their content without JavaScript', () => {
  for (const { path, h1 } of PAGES) {
    test(`${path} shows its H1 with JS disabled`, async ({ browser }) => {
      const context = await browser.newContext({ javaScriptEnabled: false });
      const page = await context.newPage();
      await page.goto(path);
      await expect(page.locator('main h1')).toBeVisible();
      await expect(page.locator('main h1')).toContainText(h1, { ignoreCase: true });
      await context.close();
    });
  }

  // Brief W-7: the Waitlist section now mounts the real EarlyAccessForm. The e2e battery's `web`
  // service always has PUBLIC_WAITLIST_ENDPOINT=/__dev/waitlist set (compose.dev.yml), so this shows
  // the real <form>, not the mailto-only fail-closed branch (that's covered directly by
  // PricingPage.test.ts, whose Vitest env has no endpoint, and by early-access-form.spec.ts's own
  // dedicated CU-W7-1..4 coverage of the form's behavior).
  test('/pricing (pre-GA) shows the real waitlist <form> and the FAQ, no plans', async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/pricing');
    const form = page.locator('.pr-waitlist form[data-early-access-form]');
    await expect(form).toBeVisible();
    await expect(form).toHaveAttribute('action', '/__dev/waitlist');
    await expect(page.locator('.pr-plans')).toHaveCount(0);
    await expect(page.locator('.pr-faq-grid .card')).toHaveCount(3);
    await context.close();
  });

  test('/company shows the 4 numbered principles and the mailto contact line, no <img>', async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/company');
    await expect(page.locator('.company-principles-grid .card')).toHaveCount(4);
    await expect(page.locator('.company-principle-number').first()).toHaveText('01');
    const contactLink = page.locator('.company-contact-line a');
    await expect(contactLink).toHaveAttribute('href', 'mailto:hello@letsylabs.com');
    await expect(page.locator('img')).toHaveCount(0);
    await context.close();
  });
});

test.describe('SiteNav marks the active Pricing/Company section', () => {
  test('/pricing highlights "Pricing"', async ({ page }) => {
    await page.goto('/pricing');
    const link = page.locator('.site-nav-links a', { hasText: 'Pricing' });
    await expect(link).toHaveClass(/is-active/);
  });

  test('/company highlights "Company"', async ({ page }) => {
    await page.goto('/company');
    const link = page.locator('.site-nav-links a', { hasText: 'Company' });
    await expect(link).toHaveClass(/is-active/);
  });
});

test.describe('LangSwitch preserves the route on /pricing and /company', () => {
  for (const path of ['/pricing', '/company']) {
    test(`${path} -> /es${path} and back`, async ({ page }) => {
      await page.goto(path);
      await page.getByRole('link', { name: 'ES', exact: true }).first().click();
      await expect(page).toHaveURL(new RegExp(`/es${path}/?$`));
      await page.getByRole('link', { name: 'EN', exact: true }).first().click();
      await expect(page).toHaveURL(new RegExp(`${path}/?$`));
    });
  }
});
