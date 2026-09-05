import { expect, test } from '@playwright/test';

// Brief W-2 entregable 5: everything site-fx drives must be disabled under
// prefers-reduced-motion, and in particular `data-reveal` elements must be visible WITHOUT
// scrolling (they are never CSS-hidden by default -- see src/scripts/site-fx.ts's doc comment; this
// is the "no scroll" assertion the brief calls for).
//
// Uses `page.emulateMedia({ reducedMotion: 'reduce' })` rather than the `test.use({ reducedMotion:
// 'reduce' })` context fixture: verified directly (throwaway debug spec) that in this repo's e2e
// container (mcr.microsoft.com/playwright:v1.62.1-noble) the context-level fixture does not
// actually flip `matchMedia('(prefers-reduced-motion: reduce)').matches` -- `page.emulateMedia()`
// does. Filed here rather than silently worked around: if this repo's Playwright/browser image is
// upgraded, worth re-checking whether the context fixture starts working and this comment/pattern
// can be simplified back.

test.describe('site-fx under prefers-reduced-motion', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('every [data-reveal] element is visible without scrolling', async ({ page }) => {
    await page.goto('/dev/components');
    const reveals = page.locator('[data-reveal]');
    const count = await reveals.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(reveals.nth(i)).toBeVisible();
    }
  });

  test('counters show their final formatted value immediately (no count-up animation)', async ({ page }) => {
    await page.goto('/dev/components');
    const counters = page.locator('[data-counter]');
    await expect(counters.nth(0)).toHaveText('<1s');
    await expect(counters.nth(1)).toHaveText('20ms');
    await expect(counters.nth(2)).toHaveText('100%');
  });

  test('the SVG pulse dot is hidden outright, not just frozen mid-path', async ({ page }) => {
    await page.goto('/dev/components');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-pulse-dot="dev-pulse"]')).toBeHidden();
  });
});

test.describe('site-fx with motion allowed', () => {
  test('[data-reveal] content still ends up visible (reveals on scroll into view)', async ({ page }) => {
    await page.goto('/dev/components');
    const firstReveal = page.locator('[data-reveal]').first();
    await firstReveal.scrollIntoViewIfNeeded();
    await expect(firstReveal).toBeVisible();
  });

  test('the SVG pulse dot is visible and animates (cx changes over time)', async ({ page }) => {
    await page.goto('/dev/components');
    await page.waitForLoadState('networkidle');
    const dot = page.locator('[data-pulse-dot="dev-pulse"]');
    await expect(dot).toBeVisible();
    const cxBefore = await dot.getAttribute('cx');
    await page.waitForTimeout(500);
    const cxAfter = await dot.getAttribute('cx');
    expect(cxAfter).not.toBe(cxBefore);
  });
});
