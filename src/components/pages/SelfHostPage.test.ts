import { getByRole, getByText } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';
import { renderToBody } from '../../test/render-astro';
import en from '../../i18n/en.json';
import es from '../../i18n/es.json';
import SelfHostPage from './SelfHostPage.astro';

describe('SelfHostPage', () => {
  it('renders the English hero, audio-never-leaves diagram and terminal', async () => {
    const body = await renderToBody(SelfHostPage, { props: { locale: 'en' } });
    expect(getByRole(body, 'heading', { level: 1 }).textContent?.trim()).toBe(en.selfHost.hero.h1);
    expect(getByText(body, en.selfHost.audioNeverLeaves.badge)).toBeTruthy();
    expect(body.textContent).toContain('open weights');
    expect(body.textContent).not.toContain('voxtral');
  });

  it('renders the Spanish copy', async () => {
    const body = await renderToBody(SelfHostPage, { props: { locale: 'es' } });
    expect(getByRole(body, 'heading', { level: 1 }).textContent?.trim()).toBe(es.selfHost.hero.h1);
  });

  it('the single hero CTA is a mailto: link', async () => {
    const body = await renderToBody(SelfHostPage, { props: { locale: 'en' } });
    const ctas = body.querySelectorAll('.page-hero-ctas a');
    expect(ctas).toHaveLength(1);
    expect(ctas[0].getAttribute('href')).toBe('mailto:hello@letsylabs.com');
  });

  it('renders the comparison table inside an overflow-x:auto container', async () => {
    const body = await renderToBody(SelfHostPage, { props: { locale: 'en' } });
    const scroll = body.querySelector('.sh-comparison-scroll');
    expect(scroll).not.toBeNull();
    expect(scroll?.querySelector('[role="table"]')).not.toBeNull();
    expect(scroll?.querySelectorAll('[role="row"]').length).toBe(6);
  });

  it('the license line links "talk to us" as a mailto:', async () => {
    const body = await renderToBody(SelfHostPage, { props: { locale: 'en' } });
    const link = body.querySelector('.sh-license-line a');
    expect(link?.getAttribute('href')).toBe('mailto:hello@letsylabs.com');
  });

  it('renders the 3 security chips', async () => {
    const body = await renderToBody(SelfHostPage, { props: { locale: 'en' } });
    expect(body.querySelectorAll('.sh-chip')).toHaveLength(3);
  });
});
