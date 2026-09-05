import { expect, test } from '@playwright/test';

// CU-WEB-2: both locales must declare hreflang alternates (en, es, x-default) so search engines
// and the language switcher agree on where "the same page" lives in the other language.

async function hreflangValues(page: import('@playwright/test').Page) {
  const links = await page.locator('link[rel="alternate"][hreflang]').all();
  const values = await Promise.all(links.map((link) => link.getAttribute('hreflang')));
  return values.sort();
}

test('the English home page declares hreflang for en, es and x-default', async ({ page }) => {
  await page.goto('/');
  expect(await hreflangValues(page)).toEqual(['en', 'es', 'x-default']);
});

test('the Spanish home page declares hreflang for en, es and x-default', async ({ page }) => {
  await page.goto('/es/');
  expect(await hreflangValues(page)).toEqual(['en', 'es', 'x-default']);
});
