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
