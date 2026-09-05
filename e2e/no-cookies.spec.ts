import { expect, test } from '@playwright/test';

// Brief W-7 (D-W7-5): no analytics -> no cookies, no banner. Ratchet: after visiting every route
// (EN/ES), the browser context holds zero cookies AND localStorage is empty. Same route list as
// `no-overflow.spec.ts` (kept in sync -- a new page added there should be added here too).

const PAGES = [
  '/',
  '/es/',
  '/voice',
  '/es/voice',
  '/telephony',
  '/es/telephony',
  '/compliance',
  '/es/compliance',
  '/self-host',
  '/es/self-host',
  '/open-source',
  '/es/open-source',
  '/pricing',
  '/es/pricing',
  '/company',
  '/es/company',
  '/privacy',
  '/es/privacy',
  '/terms',
  '/es/terms',
];

test('zero cookies and empty localStorage after visiting every route', async ({
  page,
  context,
}) => {
  for (const path of PAGES) {
    await page.goto(path);
    const localStorageLength = await page.evaluate(() => window.localStorage.length);
    expect(localStorageLength, `localStorage on ${path}`).toBe(0);
  }
  const cookies = await context.cookies();
  expect(cookies).toEqual([]);
});
