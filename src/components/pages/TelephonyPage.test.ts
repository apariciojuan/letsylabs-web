import { getByRole, getByText } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';
import { renderToBody } from '../../test/render-astro';
import en from '../../i18n/en.json';
import es from '../../i18n/es.json';
import TelephonyPage from './TelephonyPage.astro';

describe('TelephonyPage', () => {
  it('renders the English hero (amber accent), handoff diagram and capability cards', async () => {
    const body = await renderToBody(TelephonyPage, { props: { locale: 'en' } });
    expect(getByRole(body, 'heading', { level: 1 }).textContent?.trim()).toBe(en.telephony.hero.h1);
    expect(body.querySelector('.page-hero.radial-tel')).not.toBeNull();
    expect(getByText(body, en.telephony.handoff.label)).toBeTruthy();
    expect(getByText(body, en.telephony.capabilities.trunk.title)).toBeTruthy();
  });

  it('renders the Spanish copy', async () => {
    const body = await renderToBody(TelephonyPage, { props: { locale: 'es' } });
    expect(getByRole(body, 'heading', { level: 1 }).textContent?.trim()).toBe(es.telephony.hero.h1);
    expect(getByText(body, es.telephony.roadmap.claim)).toBeTruthy();
  });

  it('only has a single primary CTA in the hero (no ghost)', async () => {
    const body = await renderToBody(TelephonyPage, { props: { locale: 'en' } });
    const ctas = body.querySelectorAll('.page-hero-ctas a');
    expect(ctas).toHaveLength(1);
    expect(ctas[0].className).toContain('btn-primary');
  });

  it('is the only page carrying the Asterisk/3CX/SIP chips', async () => {
    const body = await renderToBody(TelephonyPage, { props: { locale: 'en' } });
    expect(getByText(body, 'Asterisk')).toBeTruthy();
    expect(getByText(body, '3CX')).toBeTruthy();
    const chips = body.querySelectorAll('.tel-chip');
    expect(chips).toHaveLength(3);
  });

  it('renders the 3 roadmap "COMING SOON" badges', async () => {
    const body = await renderToBody(TelephonyPage, { props: { locale: 'en' } });
    const badges = body.querySelectorAll('.tel-roadmap-badges .badge');
    expect(badges).toHaveLength(3);
    badges.forEach((badge) => expect(badge.textContent).toContain('COMING SOON'));
  });

  it('the compliance link is localized', async () => {
    const enBody = await renderToBody(TelephonyPage, { props: { locale: 'en' } });
    expect(enBody.querySelector('.compliance-link')?.getAttribute('href')).toBe('/compliance');
    const esBody = await renderToBody(TelephonyPage, { props: { locale: 'es' } });
    expect(esBody.querySelector('.compliance-link')?.getAttribute('href')).toBe('/es/compliance');
  });
});
