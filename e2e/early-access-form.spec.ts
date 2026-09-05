import { expect, test, type Locator } from '@playwright/test';

// Brief W-7 (spec docs/specs/web_formulario_seguridad.md, D-W7-1..4): the real EarlyAccessForm,
// mounted in the Homepage's FinalCta (#cta). The `web` service in compose.dev.yml sets
// PUBLIC_WAITLIST_ENDPOINT=/__dev/waitlist (scripts/dev/waitlist-mock.mjs, dev-only), so the e2e
// battery here always sees the real <form>, not the mailto-only fail-closed branch (that branch is
// covered directly by EarlyAccessForm.test.ts/FinalCta.test.ts, whose Vitest env has no endpoint
// set, matching the local `pnpm build` battery -- D-W7-6).

const FORM = '#cta form[data-early-access-form]';

/**
 * FinalCta sits at the very bottom of the homepage, exactly where Astro's dev-only toolbar
 * (`<astro-dev-toolbar>`, `astro dev` only -- never ships in `dist/`) docks. A coordinate-based
 * `.click()` on the submit button -- even with `force: true`, which only skips PLAYWRIGHT's own
 * actionability check, not the real browser's hit-testing -- lands on the toolbar instead of the
 * button there, so the click never reaches it and the submit handler never fires. Submitting via
 * `Enter` in the email field triggers the form's native `submit` event directly (standard HTML
 * behavior for a single text input in a form), with no pointer coordinates involved at all.
 */
async function submitViaEnter(form: Locator) {
  await form.locator('input[name="email"]').press('Enter');
}

test.describe('EarlyAccessForm — with JS (CU-W7-1)', () => {
  test('submitting a valid email shows "You\'re on the list ✓" and disables the fields', async ({
    page,
  }) => {
    await page.goto('/');
    const form = page.locator(FORM);
    await form.locator('input[name="email"]').fill('you@company.com');
    await submitViaEnter(form);

    await expect(form.locator('[data-early-access-status]')).toHaveText("You're on the list ✓");
    await expect(form.locator('input[name="email"]')).toBeDisabled();
    await expect(form.locator('button[type="submit"]')).toBeDisabled();
  });

  test('an email starting with fail@ shows the error message and focuses the mailto: link', async ({
    page,
  }) => {
    await page.goto('/');
    const form = page.locator(FORM);
    await form.locator('input[name="email"]').fill('fail@x.com');
    await submitViaEnter(form);

    await expect(form.locator('[data-early-access-status]')).toHaveText(
      'Something went wrong — email us instead',
    );
    await expect(form.locator('.eaf-mailto-link')).toBeFocused();
  });

  test('a filled honeypot shows success WITHOUT any network request (CU-W7-4)', async ({
    page,
  }) => {
    await page.goto('/');
    let waitlistRequested = false;
    page.on('request', (req) => {
      if (req.url().includes('/__dev/waitlist')) waitlistRequested = true;
    });

    const form = page.locator(FORM);
    await form.locator('input[name="email"]').fill('you@company.com');
    await form.locator('input[name="_gotcha"]').fill('i-am-a-bot', { force: true });
    await submitViaEnter(form);

    await expect(form.locator('[data-early-access-status]')).toHaveText("You're on the list ✓");
    expect(waitlistRequested).toBe(false);
  });
});

test.describe('EarlyAccessForm — without JS (CU-W7-3)', () => {
  test('the <form> has action="/__dev/waitlist" and method="POST"', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/');
    const form = page.locator(FORM);
    await expect(form).toHaveAttribute('action', '/__dev/waitlist');
    await expect(form).toHaveAttribute('method', 'POST');
    await context.close();
  });

  test('a native POST against that action succeeds against the dev mock', async ({ request }) => {
    const response = await request.post('/__dev/waitlist', {
      multipart: { email: 'you@company.com', country: 'ES', building: 'a voice agent' },
    });
    expect(response.ok()).toBe(true);
    expect(await response.json()).toEqual({ ok: true });
  });
});

test.describe('/privacy and /terms (CU-W7-8)', () => {
  const PAGES = [
    { path: '/privacy', h1: 'Privacy policy', token: 'PRIVACY_POLICY' },
    { path: '/es/privacy', h1: 'Política de privacidad', token: 'PRIVACY_POLICY' },
    { path: '/terms', h1: 'Terms', token: 'TERMS' },
    { path: '/es/terms', h1: 'Términos', token: 'TERMS' },
  ];

  for (const { path, h1, token } of PAGES) {
    test(`${path} responds 200, shows its H1 and the marked {${token}} hole`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.locator('main h1')).toHaveText(h1);
      await expect(page.locator(`[data-placeholder="${token}"]`)).toBeVisible();
    });
  }
});
