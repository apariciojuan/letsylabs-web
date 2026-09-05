import { expect, test } from '@playwright/test';

// Brief W-3: the real homepage at `/` (EN) and `/es/` (ES) -- 11 blocks, i18n, reduced-motion
// fallbacks, and the interactive pieces (pipeline re-routing, Developers tabs, language switch).

const SECTION_IDS = [
  'pipeline',
  'voice',
  'telephony',
  'compliance',
  'selfhost',
  'opensource',
  'developers',
  'cta',
];

for (const path of ['/', '/es/']) {
  test.describe(`homepage blocks on ${path}`, () => {
    test('renders the hero, ticker and all id-carrying sections', async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('.ticker')).toBeVisible();
      for (const id of SECTION_IDS) {
        await expect(page.locator(`#${id}`)).toBeAttached();
      }
      await expect(page.locator('.vision-section')).toBeAttached();
    });
  });
}

test.describe('reduced-motion (homepage)', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('the hero code block shows the highlighted snippet from the first render, with no typing cursor', async ({
    page,
  }) => {
    await page.goto('/');
    const highlighted = page.locator('[data-hero-code-highlighted]');
    const typing = page.locator('[data-hero-code-typing]');
    await expect(highlighted).toBeVisible();
    await expect(typing).toBeHidden();
    await expect(highlighted).toContainText('session_id');
  });

  test('the ticker does not scroll (no visible marquee translation change)', async ({ page }) => {
    await page.goto('/');
    const track = page.locator('.ticker-track');
    const transformBefore = await track.evaluate((el) => getComputedStyle(el).transform);
    await page.waitForTimeout(500);
    const transformAfter = await track.evaluate((el) => getComputedStyle(el).transform);
    expect(transformAfter).toBe(transformBefore);
  });

  test('the Voice transcript shows the full sentence immediately', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-voice-transcript]')).toHaveText(
      'Hola, quiero mover mi cita del jueves a la mañana.',
    );
  });

  test('the Developers counters show their final value immediately', async ({ page }) => {
    await page.goto('/');
    const counters = page.locator('[data-counter]');
    await expect(counters.nth(0)).toHaveText('<1s');
    await expect(counters.nth(1)).toHaveText('20ms');
    await expect(counters.nth(2)).toHaveText('100%');
  });
});

test.describe('motion allowed (homepage)', () => {
  test('the Voice transcript changes over time', async ({ page }) => {
    await page.goto('/');
    const el = page.locator('[data-voice-transcript]');
    const first = await el.textContent();
    await page.waitForTimeout(800);
    const second = await el.textContent();
    expect(second).not.toBe(first);
  });

  test('a Developers counter reaches its target value after scrolling into view', async ({
    page,
  }) => {
    await page.goto('/');
    await page.locator('#developers').scrollIntoViewIfNeeded();
    await expect(page.locator('[data-counter]').nth(2)).toHaveText('100%', { timeout: 3000 });
  });
});

test.describe('pipeline re-routing on the real homepage', () => {
  test('clicking a source and a destination reroutes the active path (mouse)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const browserSource = page.getByTestId('pipeline-source-browser');
    const ollama = page.getByTestId('pipeline-destination-ollama');

    await browserSource.click();
    await ollama.click();

    await expect(browserSource).toHaveAttribute('aria-pressed', 'true');
    await expect(ollama).toHaveAttribute('aria-pressed', 'true');
  });

  test('is operable by keyboard (Enter activates a focused source)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const appSource = page.getByTestId('pipeline-source-app');

    await appSource.focus();
    await page.keyboard.press('Enter');

    await expect(appSource).toHaveAttribute('aria-pressed', 'true');
  });
});

test.describe('Developers code tabs on the real homepage', () => {
  test('clicking a tab switches the active panel (mouse)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const rustTab = page.locator('#dev-tab-rust');
    const curlPanel = page.locator('#dev-panel-curl');
    const rustPanel = page.locator('#dev-panel-rust');

    await expect(curlPanel).toBeVisible();
    await rustTab.click();

    await expect(rustTab).toHaveAttribute('aria-selected', 'true');
    await expect(rustPanel).toBeVisible();
    await expect(curlPanel).toBeHidden();
  });

  test('ArrowRight moves from curl to Rust and focuses it', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const curlTab = page.locator('#dev-tab-curl');
    const rustTab = page.locator('#dev-tab-rust');

    await curlTab.focus();
    await page.keyboard.press('ArrowRight');

    await expect(rustTab).toHaveAttribute('aria-selected', 'true');
    await expect(rustTab).toBeFocused();
  });
});

test.describe('language switch on the real homepage', () => {
  test('from / goes to /es/ and back, preserving the page', async ({ page }) => {
    // Scoped to `main#top h1` (BaseLayout's content wrapper): some environments surface unrelated
    // browser-chrome h1s (devtools-style overlays) on a plain `h1` locator, made `page.locator('h1')`
    // ambiguous here even though every other spec's single-page `h1` check is unaffected.
    const heroH1 = page.locator('main#top h1');
    await page.goto('/');
    await page.getByRole('link', { name: 'ES', exact: true }).first().click();
    await expect(page).toHaveURL(/\/es\/?$/);
    await expect(heroH1).toContainText('Dale voz a tu IA');

    await page.getByRole('link', { name: 'EN', exact: true }).first().click();
    await expect(page).toHaveURL(/\/$/);
    await expect(heroH1).toContainText('Give your AI a voice');
  });
});

test.describe('Compliance link', () => {
  test('from / points at /compliance', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.compliance-link')).toHaveAttribute('href', '/compliance');
  });

  test('from /es/ points at /es/compliance', async ({ page }) => {
    await page.goto('/es/');
    await expect(page.locator('.compliance-link')).toHaveAttribute('href', '/es/compliance');
  });
});
