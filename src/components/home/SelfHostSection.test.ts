import { getByText } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';
import { renderToBody } from '../../test/render-astro';
import en from '../../i18n/en.json';
import es from '../../i18n/es.json';
import SelfHostSection from './SelfHostSection.astro';

describe('SelfHostSection', () => {
  it('renders the English H2/text and both mini-cards', async () => {
    const body = await renderToBody(SelfHostSection, { props: { locale: 'en' } });
    expect(body.querySelector('h2')?.textContent).toBe(en.home.selfHost.h2);
    expect(getByText(body, en.home.selfHost.cardManagedCloud)).toBeTruthy();
    expect(body.querySelectorAll('.selfhost-card')).toHaveLength(2);
  });

  it('renders the Spanish H2/text', async () => {
    const body = await renderToBody(SelfHostSection, { props: { locale: 'es' } });
    expect(body.querySelector('h2')?.textContent).toBe(es.home.selfHost.h2);
  });

  it('the terminal has no copy button (Terminal variant, not CodeBlock) and its 6 lines carry staggered data-delay', async () => {
    const body = await renderToBody(SelfHostSection, { props: { locale: 'en' } });
    expect(body.querySelector('[data-copy-button]')).toBeNull();
    const lines = body.querySelectorAll('.code-block-body > [data-reveal]');
    expect(lines).toHaveLength(6);
    expect(lines[0].hasAttribute('data-delay')).toBe(false);
    expect(lines[1].getAttribute('data-delay')).toBe('200');
    expect(lines[5].getAttribute('data-delay')).toBe('800');
    expect(body.textContent).toContain('docker compose up -d');
    expect(body.textContent).toContain('wss://0.0.0.0:8443/audio');
  });
});
