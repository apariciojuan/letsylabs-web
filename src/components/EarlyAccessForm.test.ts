import { describe, expect, it } from 'vitest';
import { renderToBody } from '../test/render-astro';
import en from '../i18n/en.json';
import es from '../i18n/es.json';
import { buildMailto } from '../scripts/early-access-form';
import EarlyAccessForm from './EarlyAccessForm.astro';

describe('EarlyAccessForm — no endpoint (CU-W7-2, fail-closed)', () => {
  it('renders NO <form>, only the mailto: primary CTA and a note (EN)', async () => {
    const body = await renderToBody(EarlyAccessForm, { props: { locale: 'en' } });
    expect(body.querySelector('form')).toBeNull();
    const mailtoLink = body.querySelector('.eaf-mailto-only a');
    expect(mailtoLink?.getAttribute('href')).toBe(buildMailto('en'));
    expect(mailtoLink?.textContent).toContain(en.earlyAccessForm.submitCta);
    expect(body.textContent).toContain(en.earlyAccessForm.mailtoOnlyNote);
  });

  it('renders NO <form> for an explicitly empty endpoint string either (ES)', async () => {
    const body = await renderToBody(EarlyAccessForm, { props: { locale: 'es', endpoint: '' } });
    expect(body.querySelector('form')).toBeNull();
    expect(body.querySelector('.eaf-mailto-only a')?.getAttribute('href')).toBe(buildMailto('es'));
  });

  it('still shows the privacy notice hole and link even without a form', async () => {
    const body = await renderToBody(EarlyAccessForm, { props: { locale: 'en' } });
    expect(body.querySelector('[data-placeholder="PRIVACY_NOTICE"]')).not.toBeNull();
    const privacyLink = body.querySelector('.eaf-privacy a');
    expect(privacyLink?.getAttribute('href')).toBe('/privacy');
    expect(privacyLink?.textContent).toBe(en.earlyAccessForm.privacyLinkLabel);
  });
});

describe('EarlyAccessForm — with endpoint (CU-W7-1/3/4)', () => {
  const endpoint = 'https://formspree.io/f/mock';

  it('renders the <form> with action/method, the 3 real fields and the honeypot (EN)', async () => {
    const body = await renderToBody(EarlyAccessForm, { props: { locale: 'en', endpoint } });
    const form = body.querySelector('form');
    expect(form).not.toBeNull();
    expect(form?.getAttribute('action')).toBe(endpoint);
    expect(form?.getAttribute('method')).toBe('POST');

    expect(form?.querySelector('input[name="email"][type="email"]')).not.toBeNull();
    expect(form?.querySelector('input[name="email"]')?.hasAttribute('required')).toBe(true);
    expect(form?.querySelector('input[name="country"]')).not.toBeNull();
    expect(form?.querySelector('input[name="building"]')).not.toBeNull();

    const honeypotInput = form?.querySelector<HTMLInputElement>('input[name="_gotcha"]');
    expect(honeypotInput).not.toBeNull();
    expect(honeypotInput?.getAttribute('tabindex')).toBe('-1');
    expect(honeypotInput?.getAttribute('autocomplete')).toBe('off');
    expect(honeypotInput?.closest('label')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders the status region with role=status/aria-live=polite and the localized messages', async () => {
    const body = await renderToBody(EarlyAccessForm, { props: { locale: 'en', endpoint } });
    const status = body.querySelector('[data-early-access-status]');
    expect(status?.getAttribute('role')).toBe('status');
    expect(status?.getAttribute('aria-live')).toBe('polite');
    expect(status?.getAttribute('data-success-message')).toBe(en.earlyAccessForm.successMessage);
    expect(status?.getAttribute('data-error-message')).toBe(en.earlyAccessForm.errorMessage);
  });

  it('renders both CTAs: a submit button and the "Talk to us" mailto: ghost link', async () => {
    const body = await renderToBody(EarlyAccessForm, { props: { locale: 'en', endpoint } });
    const submitButton = body.querySelector('button[type="submit"]');
    expect(submitButton?.textContent).toContain(en.earlyAccessForm.submitCta);
    const mailtoLink = body.querySelector<HTMLAnchorElement>('.eaf-mailto-link');
    expect(mailtoLink?.getAttribute('href')).toBe(buildMailto('en'));
    expect(mailtoLink?.textContent).toContain(en.earlyAccessForm.talkToUsCta);
  });

  it('renders the Spanish form with the Spanish labels/placeholders', async () => {
    const body = await renderToBody(EarlyAccessForm, { props: { locale: 'es', endpoint } });
    const form = body.querySelector('form');
    expect(form?.querySelector('input[name="email"]')?.getAttribute('placeholder')).toBe(
      es.earlyAccessForm.emailPlaceholder,
    );
    expect(form?.textContent).toContain(es.earlyAccessForm.buildingLabel);
  });
});
