import { describe, expect, it } from 'vitest';
import { renderToBody } from '../../test/render-astro';
import HomePage from './HomePage.astro';

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

describe('HomePage', () => {
  it('renders all 11 shipped blocks (hero, ticker, and the 9 id-carrying sections) in document order', async () => {
    const body = await renderToBody(HomePage, { props: { locale: 'en' } });
    expect(body.querySelector('h1')).not.toBeNull(); // Hero
    expect(body.querySelector('.ticker')).not.toBeNull(); // EventTicker
    const idOrder = SECTION_IDS.map((id) => body.querySelector(`#${id}`)).filter(Boolean);
    expect(idOrder).toHaveLength(SECTION_IDS.length);
    // Vision has no id/wrapper of its own besides the class -- checked separately.
    expect(body.querySelector('.vision-section')).not.toBeNull();

    const allSectionEls = Array.from(body.querySelectorAll('section'));
    const positions = SECTION_IDS.map((id) => allSectionEls.findIndex((el) => el.id === id));
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i]).toBeGreaterThan(positions[i - 1]);
    }
  });

  it('renders no cookie banner (block 12 is deliberately not implemented)', async () => {
    const body = await renderToBody(HomePage, { props: { locale: 'en' } });
    expect(body.textContent).not.toContain('analytics cookie');
  });

  it('renders the Spanish page with translated section headings', async () => {
    const body = await renderToBody(HomePage, { props: { locale: 'es' } });
    expect(body.querySelector('h1')?.textContent).toBe(
      'Dale voz a tu IA — en el teléfono y en la web.',
    );
  });
});
