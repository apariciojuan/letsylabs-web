import { describe, expect, it } from 'vitest';
import { renderToBody } from '../test/render-astro';
import en from '../i18n/en.json';
import es from '../i18n/es.json';
import LegalPage from './LegalPage.astro';

describe('LegalPage', () => {
  it('renders the EN heading, a marked {TOKEN} hole and the pending-review note', async () => {
    const body = await renderToBody(LegalPage, {
      props: { locale: 'en', heading: en.privacy.h1, placeholderToken: 'PRIVACY_POLICY' },
    });
    expect(body.querySelector('h1')?.textContent).toBe('Privacy policy');
    const hole = body.querySelector('[data-placeholder="PRIVACY_POLICY"]');
    expect(hole?.textContent).toBe('{PRIVACY_POLICY}');
    expect(body.textContent).toContain(en.legal.pendingReviewNote);
  });

  it('renders the ES heading and note for /terms', async () => {
    const body = await renderToBody(LegalPage, {
      props: { locale: 'es', heading: es.terms.h1, placeholderToken: 'TERMS' },
    });
    expect(body.querySelector('h1')?.textContent).toBe('Términos');
    expect(body.querySelector('[data-placeholder="TERMS"]')).not.toBeNull();
    expect(body.textContent).toContain(es.legal.pendingReviewNote);
  });
});
