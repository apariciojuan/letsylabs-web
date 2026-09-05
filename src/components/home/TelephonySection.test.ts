import { getByText } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';
import { renderToBody } from '../../test/render-astro';
import en from '../../i18n/en.json';
import es from '../../i18n/es.json';
import TelephonySection from './TelephonySection.astro';

describe('TelephonySection', () => {
  it('renders the English eyebrow/H2/text and both rows with their badges', async () => {
    const body = await renderToBody(TelephonySection, { props: { locale: 'en' } });
    expect(getByText(body, en.home.telephony.eyebrow)).toBeTruthy();
    expect(body.querySelector('h2')?.textContent).toBe(en.home.telephony.h2);
    expect(getByText(body, en.home.telephony.yourTrunk)).toBeTruthy();
    expect(getByText(body, en.home.telephony.managedNumbers)).toBeTruthy();
    expect(getByText(body, en.home.telephony.availableAtGa)).toBeTruthy();
    expect(getByText(body, en.nav.megaMenu.comingSoon)).toBeTruthy();
    expect(getByText(body, en.home.telephony.claim)).toBeTruthy();
  });

  it('renders the Spanish copy', async () => {
    const body = await renderToBody(TelephonySection, { props: { locale: 'es' } });
    expect(body.querySelector('h2')?.textContent).toBe(es.home.telephony.h2);
    expect(getByText(body, es.home.telephony.yourTrunkSub)).toBeTruthy();
  });

  it('the second (managed numbers) row is visually de-emphasized and has no pulsing dot', async () => {
    const body = await renderToBody(TelephonySection, { props: { locale: 'en' } });
    const rows = body.querySelectorAll('.telephony-row');
    expect(rows).toHaveLength(2);
    expect(rows[1].className).toContain('telephony-row-muted');
    expect(rows[0].querySelector('.telephony-line-dot')).not.toBeNull();
    expect(rows[1].querySelector('.telephony-line-dot')).toBeNull();
  });
});
