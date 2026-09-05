import { getByRole, getByText } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';
import { renderToBody } from '../../test/render-astro';
import en from '../../i18n/en.json';
import es from '../../i18n/es.json';
import VoicePage from './VoicePage.astro';

describe('VoicePage', () => {
  it('renders the English hero, diagram and capability copy', async () => {
    const body = await renderToBody(VoicePage, { props: { locale: 'en' } });
    expect(getByRole(body, 'heading', { level: 1 }).textContent?.trim()).toBe(en.voice.hero.h1);
    expect(getByText(body, en.voice.howItWorks.label)).toBeTruthy();
    expect(body.querySelector('[data-pulse-path="voice"]')?.getAttribute('data-pulse-ms')).toBe(
      '3400',
    );
    expect(body.querySelector('[data-pulse-dot="voice"]')).not.toBeNull();
    expect(getByText(body, en.voice.capabilities.stt.title)).toBeTruthy();
    expect(getByText(body, en.voice.capabilities.tts.badge)).toBeTruthy();
    expect(getByText(body, en.voice.useCases.h2)).toBeTruthy();
    expect(body.textContent).toContain('/v1/sessions');
  });

  it('renders the Spanish copy', async () => {
    const body = await renderToBody(VoicePage, { props: { locale: 'es' } });
    expect(getByRole(body, 'heading', { level: 1 }).textContent?.trim()).toBe(es.voice.hero.h1);
    expect(getByText(body, es.voice.useCases.h2)).toBeTruthy();
  });

  it('localizes the hero CTAs (pricing + open-source)', async () => {
    const enBody = await renderToBody(VoicePage, { props: { locale: 'en' } });
    const enLinks = enBody.querySelectorAll('.page-hero-ctas a');
    expect(enLinks[0].getAttribute('href')).toBe('/pricing');
    expect(enLinks[1].getAttribute('href')).toBe('/open-source');

    const esBody = await renderToBody(VoicePage, { props: { locale: 'es' } });
    const esLinks = esBody.querySelectorAll('.page-hero-ctas a');
    expect(esLinks[0].getAttribute('href')).toBe('/es/pricing');
    expect(esLinks[1].getAttribute('href')).toBe('/es/open-source');
  });

  it('the "Read the docs" endpoints link also points at /open-source', async () => {
    const body = await renderToBody(VoicePage, { props: { locale: 'en' } });
    expect(body.querySelector('.voice-endpoints-link a')?.getAttribute('href')).toBe(
      '/open-source',
    );
  });

  it('renders the use-case table inside an overflow-x:auto container', async () => {
    const body = await renderToBody(VoicePage, { props: { locale: 'en' } });
    const scroll = body.querySelector('.voice-table-scroll');
    expect(scroll).not.toBeNull();
    expect(scroll?.querySelector('[role="table"]')).not.toBeNull();
    expect(scroll?.querySelectorAll('[role="row"]').length).toBeGreaterThanOrEqual(6);
  });

  it('every card carries data-reveal (site-fx scroll reveal)', async () => {
    const body = await renderToBody(VoicePage, { props: { locale: 'en' } });
    expect(body.querySelectorAll('.card[data-reveal]').length).toBe(4);
  });

  // Bug found in W-9 audit: the diagram/mini-demo latencies (20ms/<300ms/96ms/61ms/142ms/210ms/448ms)
  // had no target marking at all (CLAIMS_MATRIX.md, "Latencias del diagrama..." row) -- unlike Home's
  // Developers counters, which already had a TARGET badge. Homogenized per the controller's
  // 2026-09-05 decision: data-claim-state="target" on every unmeasured figure + one visible note per
  // section (no per-figure badge, which would break the diagram).
  it('stamps data-claim-state="target" on every unmeasured latency figure (CU-W9-2)', async () => {
    const body = await renderToBody(VoicePage, { props: { locale: 'en' } });
    const targetEls = body.querySelectorAll('[data-claim-state="target"]');
    // 3 diagram sub-labels (20ms/<300ms/96ms) + 1 barge-in demo (61ms) + 4 mini-timeline rows
    // (142ms/210ms/96ms/448ms) = 8.
    expect(targetEls).toHaveLength(8);
  });

  it('shows a visible "target figures" note in both the diagram and the capabilities sections', async () => {
    const body = await renderToBody(VoicePage, { props: { locale: 'en' } });
    expect(body.querySelectorAll('.voice-how-target-note, .voice-cap-target-note')).toHaveLength(2);
    expect(body.textContent).toContain(en.common.targetFiguresNote);
  });

  it('shows the Spanish target-figures note', async () => {
    const body = await renderToBody(VoicePage, { props: { locale: 'es' } });
    expect(body.textContent).toContain(es.common.targetFiguresNote);
  });
});
