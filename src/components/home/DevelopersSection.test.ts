import { getByText } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';
import { renderToBody } from '../../test/render-astro';
import en from '../../i18n/en.json';
import es from '../../i18n/es.json';
import DevelopersSection from './DevelopersSection.astro';

describe('DevelopersSection', () => {
  it('renders the English H2 and the tablist with curl active by default', async () => {
    const body = await renderToBody(DevelopersSection, { props: { locale: 'en' } });
    expect(body.querySelector('h2')?.textContent).toBe(en.home.developers.h2);
    const tabs = body.querySelectorAll('[role="tab"]');
    expect(tabs).toHaveLength(3);
    expect(body.querySelector('#dev-tab-curl')?.getAttribute('aria-selected')).toBe('true');
    expect(body.querySelector('#dev-tab-rust')?.getAttribute('aria-selected')).toBe('false');
  });

  it('without JavaScript, all 3 snippet panels render (stacked, per decision) -- none has [hidden]', async () => {
    const body = await renderToBody(DevelopersSection, { props: { locale: 'en' } });
    const panels = body.querySelectorAll('[role="tabpanel"]');
    expect(panels).toHaveLength(3);
    panels.forEach((panel) => expect(panel.hasAttribute('hidden')).toBe(false));
    expect(body.textContent).toContain('curl -X POST https://api.letsylabs.com/v1/sessions');
    expect(body.textContent).toContain('letsy::Session::create');
    expect(body.textContent).toContain('letsy.Session.create');
  });

  it('renders the illustrative label and the Python "2027" badge in English', async () => {
    const body = await renderToBody(DevelopersSection, { props: { locale: 'en' } });
    expect(getByText(body, en.home.developers.illustrativeLabel)).toBeTruthy();
    expect(body.querySelector('.developers-tab-badge')?.textContent).toBe('2027');
  });

  it('renders the Spanish H2 and illustrative label', async () => {
    const body = await renderToBody(DevelopersSection, { props: { locale: 'es' } });
    expect(body.querySelector('h2')?.textContent).toBe(es.home.developers.h2);
    expect(getByText(body, es.home.developers.illustrativeLabel)).toBeTruthy();
  });

  it('renders the 3 counters with their data-target/prefix/suffix and a TARGET badge each', async () => {
    const body = await renderToBody(DevelopersSection, { props: { locale: 'en' } });
    const counters = body.querySelectorAll('[data-counter]');
    expect(counters).toHaveLength(3);
    expect(counters[0].getAttribute('data-target')).toBe('1');
    expect(counters[0].getAttribute('data-prefix')).toBe('<');
    expect(counters[0].getAttribute('data-suffix')).toBe('s');
    expect(counters[1].getAttribute('data-target')).toBe('20');
    expect(counters[2].getAttribute('data-target')).toBe('100');
    expect(body.textContent).toMatch(/TARGET/);
  });

  it('the illustrative label text differs in Spanish (translated) but the code snippets stay in English', async () => {
    const esBody = await renderToBody(DevelopersSection, { props: { locale: 'es' } });
    expect(esBody.textContent).toContain('curl -X POST https://api.letsylabs.com/v1/sessions');
    expect(esBody.textContent).toContain('OBJETIVO');
  });
});
