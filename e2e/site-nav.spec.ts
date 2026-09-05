import { expect, test } from '@playwright/test';

// Brief W-2 entregable 3: mega menu keyboard navigation, hover, click; mobile drawer at 380px; no
// horizontal scroll. Driven against the dev-only QA page (src/pages/dev/components.astro) since no
// real page mounts SiteNav yet (that starts in W-3).

test.describe('SiteNav mega menu (desktop)', () => {
  test('opens on hover and closes once the mouse leaves', async ({ page }) => {
    await page.goto('/dev/components');
    await page.waitForLoadState('networkidle');
    const panel = page.locator('#mega-menu-product');
    await expect(panel).toBeHidden();

    await page.getByRole('button', { name: /product/i }).hover();
    await expect(panel).toBeVisible();

    await page.mouse.move(10, 10);
    await expect(panel).toBeHidden();
  });

  test('click toggles it open independent of hover, and a second click closes it', async ({
    page,
  }) => {
    await page.goto('/dev/components');
    // SiteNav's <script> (initNav -> initMegaMenus) attaches the click listener asynchronously as
    // a module script; without this wait, a click issued right after `goto()` can land before the
    // listener exists and is lost (keyboard/click events aren't replayed once a late listener
    // attaches) -- observed as a flaky "aria-expanded stays false" failure.
    await page.waitForLoadState('networkidle');
    const trigger = page.getByRole('button', { name: /product/i });
    const panel = page.locator('#mega-menu-product');

    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(panel).toBeVisible();

    // Move the mouse away: the click-driven `.is-open` state must keep it open on its own.
    await page.mouse.move(10, 10);
    await expect(panel).toBeVisible();

    await trigger.click();
    // The second click's own mouse movement onto the trigger fires a real `mouseenter` (see
    // src/scripts/nav.ts's doc comment) -- the panel legitimately stays visible via that hover
    // state until the mouse also leaves, independent of the click having un-pinned it.
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await page.mouse.move(10, 10);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(panel).toBeHidden();
  });

  test('Escape closes it and returns focus to the trigger', async ({ page }) => {
    await page.goto('/dev/components');
    await page.waitForLoadState('networkidle');
    const trigger = page.getByRole('button', { name: /product/i });

    await trigger.click();
    await expect(page.locator('#mega-menu-product')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('#mega-menu-product')).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('keyboard: focusing the trigger reveals the panel, and Tab reaches its first link', async ({
    page,
  }) => {
    await page.goto('/dev/components');
    await page.waitForLoadState('networkidle');
    const trigger = page.getByRole('button', { name: /product/i });

    await trigger.focus();
    await expect(page.locator('#mega-menu-product')).toBeVisible();

    await page.keyboard.press('Tab');
    await expect(page.locator('#mega-menu-product a').first()).toBeFocused();
  });
});

test.describe('SiteNav mobile drawer (380px)', () => {
  test.use({ viewport: { width: 380, height: 800 } });

  test('shows the drawer toggle (desktop nav hidden) with no horizontal overflow', async ({
    page,
  }) => {
    await page.goto('/dev/components');
    await expect(page.locator('[data-drawer-toggle]')).toBeVisible();
    await expect(page.locator('.site-nav-links')).toBeHidden();

    const overflows = await page.evaluate(() => {
      const root = document.documentElement;
      return root.scrollWidth > root.clientWidth;
    });
    expect(overflows).toBe(false);
  });

  test('clicking the toggle opens the drawer (aria-expanded), Escape closes it', async ({
    page,
  }) => {
    await page.goto('/dev/components');
    await page.waitForLoadState('networkidle');
    const toggle = page.locator('[data-drawer-toggle]');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#site-nav-drawer')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  test('Tab traps focus within the open drawer (wraps from the last link back to the first)', async ({
    page,
  }) => {
    await page.goto('/dev/components');
    await page.waitForLoadState('networkidle');
    await page.locator('[data-drawer-toggle]').click();

    const focusable = page.locator('#site-nav-drawer a, #site-nav-drawer button');
    const count = await focusable.count();
    await focusable.nth(count - 1).focus();

    await page.keyboard.press('Tab');
    await expect(focusable.first()).toBeFocused();
  });
});
