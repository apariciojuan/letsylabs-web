import { describe, expect, it } from 'vitest';
import { renderToBody } from '../../test/render-astro';
import en from '../../i18n/en.json';
import es from '../../i18n/es.json';
import { buildMailto } from '../../scripts/early-access-form';
import FinalCta from './FinalCta.astro';

describe('FinalCta', () => {
  it('renders the English H2, the EarlyAccessForm mailto-only CTA and the GA note', async () => {
    // No PUBLIC_WAITLIST_ENDPOINT set in the test env (same as the local `pnpm build` battery,
    // D-W7-6) -- EarlyAccessForm fails closed to its mailto-only branch, no <form>.
    const body = await renderToBody(FinalCta, { props: { locale: 'en' } });
    expect(body.querySelector('h2')?.textContent).toBe(en.home.finalCta.h2);
    expect(body.querySelector('form')).toBeNull();
    const links = Array.from(body.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(links).toContain(buildMailto('en'));
    expect(body.textContent).toContain(en.home.finalCta.note);
  });

  it('renders the Spanish H2', async () => {
    const body = await renderToBody(FinalCta, { props: { locale: 'es' } });
    expect(body.querySelector('h2')?.textContent).toBe(es.home.finalCta.h2);
  });

  it('mounts EarlyAccessForm (the .early-access-form wrapper is present)', async () => {
    const body = await renderToBody(FinalCta, { props: { locale: 'en' } });
    expect(body.querySelector('.early-access-form')).not.toBeNull();
  });
});
