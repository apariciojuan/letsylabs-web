import { expect, test } from '@playwright/test';

// Brief W-8, entregable W8-3a, CU-W8-5: a full keyboard pass over the REAL homepage (`/`), not the
// dev-only QA harness -- nav (mega menu + mobile drawer), the pipeline re-routing diagram, the
// Developers tabs and the early-access form each already have their own dedicated keyboard coverage
// (e2e/site-nav.spec.ts against /dev/components -- the exact same shared SiteNav component, so
// functionally identical; e2e/home.spec.ts's pipeline/tabs describe blocks; e2e/early-access-form.spec.ts's
// `submitViaEnter`). This file is deliberately NOT a re-test of each individually: it is the one
// thing none of those check on their own -- that Esc closes an overlay and returns focus sanely, and
// that no focus trap swallows Tab, specifically on the real page a keyboard user actually lands on.

test.describe('keyboard: mega menu Esc + focus return on the real homepage', () => {
  test('focusing the Product trigger opens the menu; Escape closes it and returns focus to the trigger', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const trigger = page.getByRole('button', { name: /product/i });
    const panel = page.locator('#mega-menu-product');

    await trigger.focus();
    await expect(panel).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});

test.describe('keyboard: mobile drawer Esc + no focus trap on the real homepage (380px)', () => {
  test.use({ viewport: { width: 380, height: 800 } });

  test('Escape closes the drawer and Tab never escapes it while open (wraps last -> first)', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const toggle = page.locator('[data-drawer-toggle]');
    const drawer = page.locator('#site-nav-drawer');

    await toggle.click();
    await expect(drawer).toBeVisible();

    const focusable = drawer.locator('a, button');
    const count = await focusable.count();
    await focusable.nth(count - 1).focus();
    await page.keyboard.press('Tab');
    await expect(focusable.first()).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });
});

test.describe('keyboard: Tab keeps moving forward from header chrome into the page, no trap', () => {
  test('Tab from the logo reaches the Product trigger within a few presses (no early trap)', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Start from a known point (the logo, the first focusable element in the header) rather than
    // pressing Tab blind from document start, which some browsers/OS focus-ring settings handle
    // inconsistently for the very first Tab of a page.
    await page.locator('.logo').first().focus();
    await expect(page.locator('.logo').first()).toBeFocused();

    let reachedTrigger = false;
    for (let i = 0; i < 5 && !reachedTrigger; i += 1) {
      await page.keyboard.press('Tab');
      reachedTrigger = await page
        .getByRole('button', { name: /product/i })
        .evaluate((el) => el === document.activeElement);
    }
    expect(reachedTrigger).toBe(true);
  });

  // Rather than counting exact Tab presses to a specific downstream element (slow and brittle --
  // the homepage has ~10 blocks of content before the pipeline section, W-3..W-3g), this proves the
  // one thing a focus trap would actually break: that Tab, pressed repeatedly from the last header
  // control, keeps landing on a DIFFERENT element each time instead of stalling on one (the pipeline
  // diagram's own keyboard operability is already proven directly in e2e/home.spec.ts by focusing its
  // testid and pressing Enter, with no traversal needed to get there).
  test('Tab keeps landing on new elements past the header, into the page body (no stall)', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const cta = page.locator('.site-nav-actions .btn').first();
    await cta.focus();
    await expect(cta).toBeFocused();

    const seen = new Set<string>();
    for (let i = 0; i < 10; i += 1) {
      await page.keyboard.press('Tab');
      const fingerprint = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return 'none';
        return `${el.tagName}#${el.id}.${el.className}`;
      });
      seen.add(fingerprint);
    }
    // A real focus trap oscillates between at most 1-2 elements (or gets stuck on exactly one); 10
    // presses landing on fewer than 4 distinct elements would be that. This is deliberately a low
    // bar, not an assertion about exactly how many focusable elements the homepage has right after
    // the header -- that number is free to change as the page evolves without making this flaky.
    expect(seen.size).toBeGreaterThanOrEqual(4);
  });
});
