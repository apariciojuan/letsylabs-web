import { expect, test } from '@playwright/test';

// Brief W-2 entregable 6: the interactive pipeline diagram's re-routing (React island), verified in
// a real browser -- see PipelineDiagramInteractive.tsx's doc comment for why this is e2e rather than
// a jsdom+React unit test (no @testing-library/react in this repo; the re-routing math itself is
// unit-tested directly in pipeline-geometry.test.ts).

test.describe('PipelineDiagramInteractive re-routing', () => {
  test('clicking a different source updates aria-pressed on both the old and new selection', async ({
    page,
  }) => {
    await page.goto('/dev/components');
    const phone = page.getByTestId('pipeline-source-phone');
    const browserSource = page.getByTestId('pipeline-source-browser');

    await expect(phone).toHaveAttribute('aria-pressed', 'true');
    await expect(browserSource).toHaveAttribute('aria-pressed', 'false');

    await browserSource.click();

    await expect(browserSource).toHaveAttribute('aria-pressed', 'true');
    await expect(phone).toHaveAttribute('aria-pressed', 'false');
  });

  test('clicking a different destination updates aria-pressed the same way', async ({ page }) => {
    await page.goto('/dev/components');
    const agent = page.getByTestId('pipeline-destination-agent');
    const ollama = page.getByTestId('pipeline-destination-ollama');

    await expect(agent).toHaveAttribute('aria-pressed', 'true');

    await ollama.click();

    await expect(ollama).toHaveAttribute('aria-pressed', 'true');
    await expect(agent).toHaveAttribute('aria-pressed', 'false');
  });

  test('is operable by keyboard (Enter activates a focused source)', async ({ page }) => {
    await page.goto('/dev/components');
    // The React island (client:load) must finish hydrating before its onKeyDown handler exists;
    // `.focus()` doesn't wait for that the way `.click()`'s actionability checks incidentally do,
    // so a `press('Enter')` issued too early is simply lost (observed as a flaky failure without
    // this wait).
    await page.waitForLoadState('networkidle');
    const appSource = page.getByTestId('pipeline-source-app');

    await appSource.focus();
    await page.keyboard.press('Enter');

    await expect(appSource).toHaveAttribute('aria-pressed', 'true');
  });

  test('exposes an aria-label describing the diagram for assistive tech', async ({ page }) => {
    await page.goto('/dev/components');
    const svg = page.locator('.pipeline-interactive-svg');
    await expect(svg).toHaveAttribute('aria-label', /letsylabs runtime|agent|LLM/i);
  });
});
