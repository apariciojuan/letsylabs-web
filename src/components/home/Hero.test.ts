import { getByRole, getByText } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';
import { renderToBody } from '../../test/render-astro';
import en from '../../i18n/en.json';
import es from '../../i18n/es.json';
import Hero from './Hero.astro';

describe('Hero', () => {
  it('renders the English eyebrow/H1/sub and CTAs', async () => {
    const body = await renderToBody(Hero, { props: { locale: 'en' } });
    expect(getByText(body, en.home.hero.eyebrow)).toBeTruthy();
    expect(body.querySelector('h1')?.textContent).toBe(en.home.hero.h1);
    expect(getByText(body, en.home.hero.sub)).toBeTruthy();
    expect(getByRole(body, 'link', { name: new RegExp(en.nav.ctaPreGa) })).toBeTruthy();
    expect(getByRole(body, 'link', { name: new RegExp(en.home.hero.ctaDocs) })).toBeTruthy();
  });

  it('renders the Spanish eyebrow/H1/sub', async () => {
    const body = await renderToBody(Hero, { props: { locale: 'es' } });
    expect(getByText(body, es.home.hero.eyebrow)).toBeTruthy();
    expect(body.querySelector('h1')?.textContent).toBe(es.home.hero.h1);
    expect(getByText(body, es.home.hero.sub)).toBeTruthy();
  });

  it('renders the waveform canvas and both code <pre>s, with the typing one hidden by default', async () => {
    const body = await renderToBody(Hero, { props: { locale: 'en' } });
    expect(body.querySelector('canvas[data-hero-wave]')).not.toBeNull();
    const highlighted = body.querySelector('[data-hero-code-highlighted]');
    const typing = body.querySelector('[data-hero-code-typing]');
    expect(highlighted).not.toBeNull();
    expect(typing).not.toBeNull();
    expect(typing?.hasAttribute('hidden')).toBe(true);
    expect(highlighted?.hasAttribute('hidden')).toBe(false);
    // The highlighted pre must contain the same literal code as the typing script's HERO_CODE.
    expect(highlighted?.textContent).toContain(
      'curl -X POST https://api.letsylabs.com/v1/sessions',
    );
    expect(highlighted?.textContent).toContain('session_id');
  });

  it('the primary CTA points at #cta and the docs CTA at #developers', async () => {
    const body = await renderToBody(Hero, { props: { locale: 'en' } });
    const links = Array.from(body.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(links).toContain('#cta');
    expect(links).toContain('#developers');
  });
});
