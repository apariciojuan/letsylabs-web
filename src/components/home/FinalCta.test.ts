import { describe, expect, it } from 'vitest';
import { renderToBody } from '../../test/render-astro';
import en from '../../i18n/en.json';
import es from '../../i18n/es.json';
import FinalCta from './FinalCta.astro';

describe('FinalCta', () => {
  it('renders the English H2, both mailto: CTAs and the GA note', async () => {
    const body = await renderToBody(FinalCta, { props: { locale: 'en' } });
    expect(body.querySelector('h2')?.textContent).toBe(en.home.finalCta.h2);
    const links = Array.from(body.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(links).toContain('mailto:hello@letsylabs.com?subject=Early%20access');
    expect(links).toContain('mailto:hello@letsylabs.com');
    expect(body.textContent).toContain(en.home.finalCta.note);
  });

  it('renders the Spanish H2', async () => {
    const body = await renderToBody(FinalCta, { props: { locale: 'es' } });
    expect(body.querySelector('h2')?.textContent).toBe(es.home.finalCta.h2);
  });

  it('leaves the W-7 form marker comment where the real form will mount, and no <form> yet', async () => {
    const body = await renderToBody(FinalCta, { props: { locale: 'en' } });
    expect(body.querySelector('form')).toBeNull();
    expect(body.innerHTML).toContain('W-7: EarlyAccessForm mounts here');
  });
});
