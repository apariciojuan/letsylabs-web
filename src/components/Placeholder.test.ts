import { describe, expect, it } from 'vitest';
import { renderToBody } from '../test/render-astro';
import Placeholder from './Placeholder.astro';

describe('Placeholder', () => {
  it('renders the literal {TOKEN} text with a data-placeholder attribute matching the token', async () => {
    const body = await renderToBody(Placeholder, {
      props: { token: 'PRICE', label: 'pending value' },
    });
    const el = body.querySelector('.placeholder');
    expect(el?.tagName).toBe('SPAN');
    expect(el?.textContent).toBe('{PRICE}');
    expect(el?.getAttribute('data-placeholder')).toBe('PRICE');
  });

  it('uses the caller-supplied (already-translated) label as both aria-label and title', async () => {
    const enBody = await renderToBody(Placeholder, {
      props: { token: 'PRICE', label: 'pending value' },
    });
    const en = enBody.querySelector('.placeholder');
    expect(en?.getAttribute('aria-label')).toBe('pending value');
    expect(en?.getAttribute('title')).toBe('pending value');

    const esBody = await renderToBody(Placeholder, {
      props: { token: 'PRICE', label: 'valor pendiente' },
    });
    const es = esBody.querySelector('.placeholder');
    expect(es?.getAttribute('aria-label')).toBe('valor pendiente');
    expect(es?.getAttribute('title')).toBe('valor pendiente');
  });

  it('works for a different token (W-5 reuse: {ARTÍCULO})', async () => {
    const body = await renderToBody(Placeholder, {
      props: { token: 'ARTÍCULO', label: 'valor pendiente' },
    });
    const el = body.querySelector('.placeholder');
    expect(el?.textContent).toBe('{ARTÍCULO}');
    expect(el?.getAttribute('data-placeholder')).toBe('ARTÍCULO');
  });
});
