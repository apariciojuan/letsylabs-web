import { getByRole, getByText } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';
import { renderToBody } from '../test/render-astro';
import SiteFooter from './SiteFooter.astro';

async function renderFooter(locale: 'en' | 'es', path = '/'): Promise<HTMLElement> {
  return renderToBody(SiteFooter, {
    props: { locale },
    request: new Request(`http://example.com${path}`),
  });
}

describe('SiteFooter', () => {
  it('renders the 4 column labels (PRODUCT/DEVELOPERS/COMPANY/LEGAL)', async () => {
    const body = await renderFooter('en');
    const labels = Array.from(body.querySelectorAll('.footer-column-label')).map((el) => el.textContent);
    expect(labels).toEqual(['PRODUCT', 'DEVELOPERS', 'COMPANY', 'LEGAL']);
  });

  it('links PRODUCT column entries to the sitemap routes (locale-aware)', async () => {
    const body = await renderFooter('es', '/es/');
    const product = getByRole(body, 'navigation', { name: 'TODO-ES: PRODUCT' });
    expect(getByText(product, 'TODO-ES: Voice').getAttribute('href')).toBe('/es/voice');
    expect(getByText(product, 'TODO-ES: Self-host').getAttribute('href')).toBe('/es/self-host');
  });

  it('renders the bottom bar with the copyright and email (language-invariant, no TODO-ES)', async () => {
    const body = await renderFooter('es');
    const bottom = body.querySelector('.site-footer-bottom-inner');
    expect(bottom?.textContent).toContain('© 2026 letsylabs');
    expect(bottom?.textContent).toContain('hello@letsylabs.com');
  });

  it('shows the Playground link as disabled text with a POST-GA badge, not a real link', async () => {
    const body = await renderFooter('en');
    expect(getByText(body, 'POST-GA').tagName).not.toBe('A');
    expect(body.querySelector('.footer-link-disabled')?.textContent).toContain('Playground');
  });

  it('renders the EN/ES switch preserving the current route', async () => {
    const body = await renderFooter('en', '/voice');
    const es = getByRole(body, 'link', { name: 'ES' });
    expect(es.getAttribute('href')).toBe('/es/voice');
  });

  it('renders "Made in the EU" and the tagline', async () => {
    const body = await renderFooter('en');
    expect(body.textContent).toContain('Made in the EU');
    expect(body.querySelector('.footer-tagline')?.textContent).toBe(
      'Realtime voice infrastructure for AI.EU-compliant by design.',
    );
  });
});
