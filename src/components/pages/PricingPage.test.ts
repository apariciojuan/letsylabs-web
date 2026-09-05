import { getByRole, getByText } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';
import { renderToBody } from '../../test/render-astro';
import en from '../../i18n/en.json';
import es from '../../i18n/es.json';
import PricingPage from './PricingPage.astro';

describe('PricingPage (gaLaunched=false, the default/pre-GA state)', () => {
  it('renders the pre-GA H1/sub and the mailto waitlist hueco, no plans', async () => {
    const body = await renderToBody(PricingPage, { props: { locale: 'en', gaLaunched: false } });
    expect(getByRole(body, 'heading', { level: 1 }).textContent?.trim()).toBe(
      en.pricing.hero.preGa.h1,
    );
    expect(getByText(body, en.pricing.hero.preGa.sub)).toBeTruthy();

    const waitlist = body.querySelector('.pr-waitlist');
    expect(waitlist).not.toBeNull();
    const cta = waitlist?.querySelector('a');
    expect(cta?.getAttribute('href')).toBe('mailto:hello@letsylabs.com?subject=Early%20access');
    expect(cta?.querySelector('.btn-label')?.textContent?.trim()).toBe(en.pricing.waitlist.cta);

    expect(body.querySelector('.pr-plans')).toBeNull();
  });

  it('never renders a real <form> (the real form is W-7)', async () => {
    const body = await renderToBody(PricingPage, { props: { locale: 'en', gaLaunched: false } });
    expect(body.querySelector('form')).toBeNull();
  });

  it('renders the Spanish copy', async () => {
    const body = await renderToBody(PricingPage, { props: { locale: 'es', gaLaunched: false } });
    expect(getByRole(body, 'heading', { level: 1 }).textContent?.trim()).toBe(
      es.pricing.hero.preGa.h1,
    );
  });
});

describe('PricingPage (gaLaunched=true, the post-GA state)', () => {
  it('renders the post-GA H1/sub and 3 plan cards, no waitlist hueco', async () => {
    const body = await renderToBody(PricingPage, { props: { locale: 'en', gaLaunched: true } });
    expect(getByRole(body, 'heading', { level: 1 }).textContent?.trim()).toBe(
      en.pricing.hero.postGa.h1,
    );
    expect(body.querySelector('.pr-waitlist')).toBeNull();

    const plans = body.querySelectorAll('.pr-plans-grid > .card');
    expect(plans).toHaveLength(3);
    expect(getByText(body, en.pricing.plans.primitives.name)).toBeTruthy();
    expect(getByText(body, en.pricing.plans.voiceAgent.name)).toBeTruthy();
    expect(getByText(body, en.pricing.plans.selfHosted.name)).toBeTruthy();
  });

  it('renders exactly 2 {PRICE} placeholders (Primitives, Voice Agent) -- Self-hosted has none', async () => {
    const body = await renderToBody(PricingPage, { props: { locale: 'en', gaLaunched: true } });
    const placeholders = body.querySelectorAll('[data-placeholder="PRICE"]');
    expect(placeholders).toHaveLength(2);
    placeholders.forEach((el) => expect(el.textContent).toBe('{PRICE}'));
  });

  it('tags the Voice Agent plan as "MOST COMMON" and gives it no hover transition', async () => {
    const body = await renderToBody(PricingPage, { props: { locale: 'en', gaLaunched: true } });
    const tag = getByText(body, en.pricing.plans.mostCommon);
    expect(tag.className).toContain('pr-plan-tag');
    const voiceCard = tag.closest('.card');
    expect(voiceCard?.className).toContain('pr-plan-voice');
    expect(voiceCard?.className).not.toContain('card-hoverable');
  });

  it("Self-hosted's plan links to hello@letsylabs.com instead of showing a price", async () => {
    const body = await renderToBody(PricingPage, { props: { locale: 'en', gaLaunched: true } });
    const selfHostedName = getByText(body, en.pricing.plans.selfHosted.name);
    const selfHostedCard = selfHostedName.closest('.card');
    const link = selfHostedCard?.querySelector('a');
    expect(link?.getAttribute('href')).toBe('mailto:hello@letsylabs.com');
    expect(link?.textContent).toContain(en.pricing.plans.selfHosted.cta);
  });
});

describe('PricingPage FAQ (rendered in both states)', () => {
  it('renders the 3 FAQ cards in the pre-GA state', async () => {
    const body = await renderToBody(PricingPage, { props: { locale: 'en', gaLaunched: false } });
    const cards = body.querySelectorAll('.pr-faq-grid > .card');
    expect(cards).toHaveLength(3);
    expect(getByText(body, en.pricing.faq.telephony.q)).toBeTruthy();
    expect(getByText(body, en.pricing.faq.earlyAccess.q)).toBeTruthy();
    expect(getByText(body, en.pricing.faq.llm.q)).toBeTruthy();
  });

  it('renders the same 3 FAQ cards in the post-GA state', async () => {
    const body = await renderToBody(PricingPage, { props: { locale: 'en', gaLaunched: true } });
    const cards = body.querySelectorAll('.pr-faq-grid > .card');
    expect(cards).toHaveLength(3);
  });
});
