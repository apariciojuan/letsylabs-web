import { describe, expect, it } from 'vitest';
import { renderToBody } from '../../test/render-astro';
import HomePage from '../home/HomePage.astro';
import VoicePage from './VoicePage.astro';
import TelephonyPage from './TelephonyPage.astro';
import SelfHostPage from './SelfHostPage.astro';
import OpenSourcePage from './OpenSourcePage.astro';

/**
 * Provider-leak ratchet (brief W-4, "Tests exigidos"): `CLAIMS_MATRIX.md` rule 4 permits naming
 * Asterisk/3CX/SIP ONLY on /telephony (and, by its already-registered extension, inside the
 * Homepage's own #telephony section) -- never on /voice, /self-host, /open-source, or anywhere else
 * on the homepage. This is a component-level test today; W-9 promotes the same check to a `dist/`
 * build ratchet (script, not a Vitest suite).
 */
const PROVIDER_NAMES = ['Asterisk', '3CX'];

describe('provider-leak ratchet (Asterisk/3CX confined to Telephony)', () => {
  it('does NOT appear anywhere on /voice', async () => {
    const body = await renderToBody(VoicePage, { props: { locale: 'en' } });
    for (const name of PROVIDER_NAMES) {
      expect(body.textContent).not.toContain(name);
    }
  });

  it('does NOT appear anywhere on /self-host', async () => {
    const body = await renderToBody(SelfHostPage, { props: { locale: 'en' } });
    for (const name of PROVIDER_NAMES) {
      expect(body.textContent).not.toContain(name);
    }
  });

  it('does NOT appear anywhere on /open-source', async () => {
    const body = await renderToBody(OpenSourcePage, { props: { locale: 'en' } });
    for (const name of PROVIDER_NAMES) {
      expect(body.textContent).not.toContain(name);
    }
  });

  it('does NOT appear on the homepage outside its #telephony section', async () => {
    const body = await renderToBody(HomePage, { props: { locale: 'en' } });
    const telephonySection = body.querySelector('#telephony');
    expect(telephonySection).not.toBeNull();
    telephonySection?.remove();
    for (const name of PROVIDER_NAMES) {
      expect(body.textContent).not.toContain(name);
    }
  });

  it('DOES appear on /telephony (positive control -- the exception this ratchet protects)', async () => {
    const body = await renderToBody(TelephonyPage, { props: { locale: 'en' } });
    for (const name of PROVIDER_NAMES) {
      expect(body.textContent).toContain(name);
    }
  });

  it('DOES appear inside the homepage #telephony section (positive control)', async () => {
    const body = await renderToBody(HomePage, { props: { locale: 'en' } });
    const telephonySection = body.querySelector('#telephony');
    for (const name of PROVIDER_NAMES) {
      expect(telephonySection?.textContent).toContain(name);
    }
  });
});
