import { getByRole, getByText } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';
import { renderToBody } from '../../test/render-astro';
import en from '../../i18n/en.json';
import es from '../../i18n/es.json';
import { buildMailto } from '../../scripts/early-access-form';
import PricingPage from './PricingPage.astro';

describe('PricingPage (gaLaunched=false, the default/pre-GA state)', () => {
  it('without waitlistEndpoint (D-W7-6 fail-closed default), shows the mailto waitlist hueco, no plans', async () => {
    const body = await renderToBody(PricingPage, { props: { locale: 'en', gaLaunched: false } });
    expect(getByRole(body, 'heading', { level: 1 }).textContent?.trim()).toBe(
      en.pricing.hero.preGa.h1,
    );
    expect(getByText(body, en.pricing.hero.preGa.sub)).toBeTruthy();

    const waitlist = body.querySelector('.pr-waitlist');
    expect(waitlist).not.toBeNull();
    expect(waitlist?.querySelector('form')).toBeNull();
    const cta = waitlist?.querySelector('.eaf-mailto-only a');
    expect(cta?.getAttribute('href')).toBe(buildMailto('en'));

    expect(body.querySelector('.pr-plans')).toBeNull();
  });

  it('with waitlistEndpoint set (brief W-7), mounts the real EarlyAccessForm <form>', async () => {
    const body = await renderToBody(PricingPage, {
      props: { locale: 'en', gaLaunched: false, waitlistEndpoint: 'https://formspree.io/f/mock' },
    });
    const form = body.querySelector('.pr-waitlist form');
    expect(form).not.toBeNull();
    expect(form?.getAttribute('action')).toBe('https://formspree.io/f/mock');
    expect(form?.querySelector('input[name="email"]')).not.toBeNull();
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
