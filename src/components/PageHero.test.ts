import { getByRole, getByText } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';
import { renderToBody } from '../test/render-astro';
import PageHero from './PageHero.astro';

describe('PageHero', () => {
  it('renders the eyebrow, H1 and sub with the given max-widths', async () => {
    const body = await renderToBody(PageHero, {
      props: {
        eyebrow: 'VOICE',
        heading: 'Realtime speech infrastructure for your applications.',
        headingMaxWidth: 820,
        sub: 'STT, TTS, turn-taking and tracing as one runtime. Your agent stays yours.',
        subMaxWidth: 600,
      },
    });
    expect(getByText(body, 'VOICE')).toBeTruthy();
    const heading = getByRole(body, 'heading', { level: 1 });
    expect(heading.textContent?.trim()).toBe(
      'Realtime speech infrastructure for your applications.',
    );
    expect(heading.getAttribute('style')).toBe('max-width:820px');
    const sub = body.querySelector('.page-hero-sub');
    expect(sub?.getAttribute('style')).toBe('max-width:600px');
  });

  it('defaults to the signal accent (radial-signal) and a signal-tone eyebrow', async () => {
    const body = await renderToBody(PageHero, {
      props: { eyebrow: 'VOICE', heading: 'x', sub: 'y' },
    });
    expect(body.querySelector('.page-hero.radial-signal')).not.toBeNull();
    expect(body.querySelector('.page-hero-eyebrow')?.className).toContain('eyebrow-signal');
  });

  it('switches to the tel accent and eyebrow tone for Telephony', async () => {
    const body = await renderToBody(PageHero, {
      props: { eyebrow: 'TELEPHONY', eyebrowTone: 'tel', heading: 'x', sub: 'y', accent: 'tel' },
    });
    expect(body.querySelector('.page-hero.radial-tel')).not.toBeNull();
    expect(body.querySelector('.page-hero-eyebrow')?.className).toContain('eyebrow-tel');
  });

  it('renders no CTA row when ctas is omitted', async () => {
    const body = await renderToBody(PageHero, {
      props: { eyebrow: 'SELF-HOST', heading: 'x', sub: 'y' },
    });
    expect(body.querySelector('.page-hero-ctas')).toBeNull();
  });

  it('renders one CTA (Self-host: a single primary mailto button)', async () => {
    const body = await renderToBody(PageHero, {
      props: {
        eyebrow: 'SELF-HOST',
        heading: 'x',
        sub: 'y',
        ctas: [{ href: 'mailto:hello@letsylabs.com', label: 'Talk to us' }],
      },
    });
    const links = body.querySelectorAll('.page-hero-ctas a');
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute('href')).toBe('mailto:hello@letsylabs.com');
    expect(links[0].className).toContain('btn-primary');
  });

  it('defaults the hero bottom padding and sub margin-bottom to the values every existing caller relies on', async () => {
    const body = await renderToBody(PageHero, {
      props: { eyebrow: 'VOICE', heading: 'x', sub: 'y' },
    });
    const section = body.querySelector('.page-hero');
    expect(section?.getAttribute('style')).toContain('--page-hero-padding-bottom:64px');
    expect(section?.getAttribute('style')).toContain('--page-hero-sub-margin-bottom:32px');
  });

  it('overrides the hero bottom padding and sub margin-bottom per instance (Pricing: 56px/8px)', async () => {
    const body = await renderToBody(PageHero, {
      props: {
        eyebrow: 'PRICING',
        heading: 'x',
        sub: 'y',
        paddingBottom: 56,
        subMarginBottom: 8,
      },
    });
    const section = body.querySelector('.page-hero');
    expect(section?.getAttribute('style')).toContain('--page-hero-padding-bottom:56px');
    expect(section?.getAttribute('style')).toContain('--page-hero-sub-margin-bottom:8px');
  });

  it('renders two CTAs in order (Voice: primary + ghost)', async () => {
    const body = await renderToBody(PageHero, {
      props: {
        eyebrow: 'VOICE',
        heading: 'x',
        sub: 'y',
        ctas: [
          { href: '/pricing', label: 'Get early access' },
          { href: '/open-source', label: 'Read the docs', variant: 'ghost' },
        ],
      },
    });
    const links = body.querySelectorAll('.page-hero-ctas a');
    expect(links).toHaveLength(2);
    expect(links[0].textContent).toContain('Get early access');
    expect(links[0].className).toContain('btn-primary');
    expect(links[1].textContent).toContain('Read the docs');
    expect(links[1].className).toContain('btn-ghost');
  });
});
