import { getByRole, getByText } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';
import { renderToBody } from '../../test/render-astro';
import en from '../../i18n/en.json';
import es from '../../i18n/es.json';
import CompliancePage from './CompliancePage.astro';

describe('CompliancePage', () => {
  it('renders the English hero (signal accent) and mailto CTA', async () => {
    const body = await renderToBody(CompliancePage, { props: { locale: 'en' } });
    expect(getByRole(body, 'heading', { level: 1 }).textContent?.trim()).toBe(
      en.compliance.hero.h1,
    );
    expect(body.querySelector('.page-hero.radial-signal')).not.toBeNull();
    const heroCta = body.querySelector('.page-hero-ctas a');
    expect(heroCta?.getAttribute('href')).toBe('mailto:hello@letsylabs.com');
    expect(heroCta?.querySelector('.btn-label')?.textContent?.trim()).toBe(en.compliance.hero.cta);
  });

  it('renders the Spanish copy', async () => {
    const body = await renderToBody(CompliancePage, { props: { locale: 'es' } });
    expect(getByRole(body, 'heading', { level: 1 }).textContent?.trim()).toBe(
      es.compliance.hero.h1,
    );
    expect(getByText(body, es.compliance.law.h2)).toBeTruthy();
  });

  it('does NOT render the prototype\'s "Spanish only / English at GA" hero note (deliberate deviation)', async () => {
    const enBody = await renderToBody(CompliancePage, { props: { locale: 'en' } });
    expect(enBody.textContent).not.toContain('English version at GA');
    const esBody = await renderToBody(CompliancePage, { props: { locale: 'es' } });
    expect(esBody.textContent).not.toContain('Página disponible en español');
  });

  it('renders exactly 4 law cards, each with an {ARTÍCULO} placeholder', async () => {
    const body = await renderToBody(CompliancePage, { props: { locale: 'en' } });
    const cards = body.querySelectorAll('.cmp-law-grid > .card');
    expect(cards).toHaveLength(4);
    cards.forEach((card) => {
      const placeholder = card.querySelector('[data-placeholder="ARTÍCULO"]');
      expect(placeholder?.textContent).toBe('{ARTÍCULO}');
    });
    expect(getByText(body, en.compliance.law.cards.disclosure.obligation)).toBeTruthy();
    expect(getByText(body, en.compliance.law.cards.retention.obligation)).toBeTruthy();
  });

  it('embeds the literal, untranslated event name in the first 2 law cards only', async () => {
    const body = await renderToBody(CompliancePage, { props: { locale: 'en' } });
    const events = body.querySelectorAll('.cmp-mono-event');
    expect(events).toHaveLength(2);
    expect(events[0].textContent).toBe('disclosure.played');
    expect(events[1].textContent).toBe('call.transfer.human');
  });

  it('also renders the {ARTÍCULO} placeholder in the law section footnote (5 total on the page)', async () => {
    const body = await renderToBody(CompliancePage, { props: { locale: 'en' } });
    const placeholders = body.querySelectorAll('[data-placeholder="ARTÍCULO"]');
    expect(placeholders).toHaveLength(5);
    expect(getByText(body, /the exact legal reference is drafted/)).toBeTruthy();
  });

  it('renders the 6-event compliant-call timeline with ts/type/detail and the right accents', async () => {
    const body = await renderToBody(CompliancePage, { props: { locale: 'en' } });
    const rows = body.querySelectorAll('.cmp-timeline-card .event-timeline-row');
    expect(rows).toHaveLength(6);

    const expected: { type: string; accent: string }[] = [
      { type: 'call.answered', accent: 'event' },
      { type: 'disclosure.played', accent: 'signal' },
      { type: 'stt.final', accent: 'event' },
      { type: 'call.transfer.human', accent: 'tel' },
      { type: 'call.ended', accent: 'event' },
      { type: 'trace.sealed', accent: 'signal' },
    ];
    expected.forEach(({ type, accent }, index) => {
      expect(rows[index].textContent).toContain(type);
      expect(rows[index].querySelector('.event-timeline-dot')?.className).toContain(
        `event-timeline-dot-${accent}`,
      );
    });
    expect(rows[0].textContent).toContain('00:00.0');
    expect(rows[3].textContent).toContain(en.compliance.timeline.events.transfer);
  });

  it('translates the timeline details in Spanish while keeping event names and timestamps literal', async () => {
    const body = await renderToBody(CompliancePage, { props: { locale: 'es' } });
    const rows = body.querySelectorAll('.cmp-timeline-card .event-timeline-row');
    expect(rows[3].textContent).toContain('call.transfer.human');
    expect(rows[3].textContent).toContain(es.compliance.timeline.events.transfer);
  });

  it('renders the export sample with the ILLUSTRATIVE badge and the illustrative JSON fields', async () => {
    const body = await renderToBody(CompliancePage, { props: { locale: 'en' } });
    const badge = body.querySelector('.cmp-export-card-header .badge');
    expect(badge?.textContent?.trim()).toBe(en.compliance.export.badge);
    expect(badge?.className).toContain('badge-coming-soon');
    const pre = body.querySelector('.cmp-export-pre');
    expect(pre?.textContent).toContain('"session"');
    expect(pre?.textContent).toContain('"ed25519"');
    expect(pre?.textContent).toContain('"ml-dsa-87"');
    expect(pre?.querySelector('.tok-keyword')).not.toBeNull();
    expect(pre?.querySelector('.tok-string')).not.toBeNull();
    expect(pre?.querySelector('.tok-number')?.textContent).toBe('47');
    expect(body.querySelector('.cmp-export-endpoint')?.textContent).toBe(
      'POST /v1/sessions/01JD…/trace/export · format: audit_json',
    );
  });

  it('renders the badge with the Spanish label', async () => {
    const body = await renderToBody(CompliancePage, { props: { locale: 'es' } });
    expect(body.querySelector('.cmp-export-card-header .badge')?.textContent?.trim()).toBe(
      es.compliance.export.badge,
    );
  });

  it('renders exactly 3 export checks', async () => {
    const body = await renderToBody(CompliancePage, { props: { locale: 'en' } });
    const checks = body.querySelectorAll('.cmp-export-check');
    expect(checks).toHaveLength(3);
    expect(getByText(body, en.compliance.export.checks.aiAct)).toBeTruthy();
  });

  it('renders exactly 3 FAQ cards', async () => {
    const body = await renderToBody(CompliancePage, { props: { locale: 'en' } });
    const cards = body.querySelectorAll('.cmp-faq-grid > .card');
    expect(cards).toHaveLength(3);
    expect(getByText(body, en.compliance.faq.items.autoCompliance.q)).toBeTruthy();
    expect(getByText(body, en.compliance.faq.items.outsideEs.q)).toBeTruthy();
    expect(getByText(body, en.compliance.faq.items.ownDisclosure.q)).toBeTruthy();
  });

  it('renders the mandatory disclaimer with the exact English translation, next to the mailto CTA', async () => {
    const body = await renderToBody(CompliancePage, { props: { locale: 'en' } });
    const disclaimer = body.querySelector('.cmp-cta-disclaimer');
    expect(disclaimer?.textContent?.trim()).toBe(en.compliance.cta.disclaimer);
    const ctaLink = body.querySelector('.cmp-cta-inner a');
    expect(ctaLink?.getAttribute('href')).toBe('mailto:hello@letsylabs.com');
  });

  it('renders the mandatory disclaimer with the exact literal Spanish text from the handoff', async () => {
    const body = await renderToBody(CompliancePage, { props: { locale: 'es' } });
    const disclaimer = body.querySelector('.cmp-cta-disclaimer');
    expect(disclaimer?.textContent?.trim()).toBe(
      'letsylabs proporciona herramientas técnicas; el cumplimiento final depende de tu implementación. No es asesoramiento jurídico.',
    );
  });

  it('every mailto link on the page points at hello@letsylabs.com', async () => {
    const body = await renderToBody(CompliancePage, { props: { locale: 'en' } });
    const mailtoLinks = Array.from(body.querySelectorAll('a[href^="mailto:"]'));
    expect(mailtoLinks.length).toBeGreaterThanOrEqual(2);
    mailtoLinks.forEach((link) => {
      expect(link.getAttribute('href')).toBe('mailto:hello@letsylabs.com');
    });
  });
});
