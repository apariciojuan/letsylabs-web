import { expect, test } from '@playwright/test';

// CU-WEB-3: content must be visible with JavaScript disabled — Astro islands are for interaction
// only, never a requirement to see the page's content. This is the "render sin JS" e2e from
// brief W-1 entregable 4.

test.describe('renders without JavaScript', () => {
  test('the English home page (/) shows its H1', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/');
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    await expect(h1).not.toHaveText('');
    await context.close();
  });

  test('the Spanish home page (/es/) shows its H1', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/es/');
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    await expect(h1).not.toHaveText('');
    await context.close();
  });
});

// Brief W-3: the real homepage's body copy must be visible without JavaScript too -- typing/
// waveform/transcript/tabs are progressive enhancement on top of server-rendered text, never a
// requirement to see it.
test.describe('the homepage renders its content without JavaScript', () => {
  test('/ shows the hero copy, the hero code snippet and every section heading', async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/');

    await expect(page.locator('h1')).toContainText('Give your AI a voice');
    await expect(page.locator('[data-hero-code-highlighted]')).toContainText('session_id');
    await expect(page.locator('#pipeline h2')).toBeVisible();
    await expect(page.locator('#voice h2')).toBeVisible();
    await expect(page.locator('#telephony h2')).toBeVisible();
    await expect(page.locator('#compliance h2')).toBeVisible();
    await expect(page.locator('#selfhost h2')).toBeVisible();
    await expect(page.locator('#opensource h2')).toBeVisible();
    await expect(page.locator('#developers h2')).toBeVisible();
    // Without JS all 3 Developers snippets are visible stacked (decision) -- not just the first.
    await expect(page.locator('#dev-panel-curl')).toBeVisible();
    await expect(page.locator('#dev-panel-rust')).toBeVisible();
    await expect(page.locator('#dev-panel-py')).toBeVisible();
    await expect(page.locator('#cta h2')).toBeVisible();

    await context.close();
  });

  test('/es/ shows the Spanish hero copy and section headings', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/es/');

    await expect(page.locator('h1')).toContainText('Dale voz a tu IA');
    await expect(page.locator('#compliance h2')).toContainText('La ley ya lo exige');

    await context.close();
  });
});

// Brief W-2 entregable 3/4/7: SiteNav's links (including the Product mega menu, reachable via pure
// CSS :hover/:focus-within, no JS) and SiteFooter's links must be visible/reachable with JavaScript
// disabled. Checked directly on the dev-only QA page, the only place both are mounted today.
test.describe('SiteNav/SiteFooter render without JavaScript (dev QA page)', () => {
  test('top-level nav links and the Product mega menu items are present', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/dev/components');

    await expect(page.getByRole('link', { name: 'Pricing' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Company' }).first()).toBeVisible();
    // The mega menu panel is a hover-only reveal in CSS; without JS the link must still exist in
    // the DOM (reachable by hovering with a mouse, or simply present for a crawler) even though it
    // is not visible before that hover.
    await expect(page.locator('#mega-menu-product a', { hasText: 'Voice' })).toHaveCount(1);

    await context.close();
  });

  test('footer columns and the bottom bar are visible', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/dev/components');

    await expect(page.locator('.footer-column-label').first()).toBeVisible();
    await expect(page.locator('.site-footer-bottom-inner')).toContainText('© 2026 letsylabs');

    await context.close();
  });
});
