import { describe, expect, it } from 'vitest';
import { renderToBody } from '../test/render-astro';
import BaseLayout from './BaseLayout.astro';

describe('BaseLayout', () => {
  it('mounts SiteNav and SiteFooter around the slotted content, under main#top', async () => {
    const body = await renderToBody(BaseLayout, {
      props: { locale: 'en', title: 'letsylabs — test' },
      slots: { default: '<p data-slot-marker>hello</p>' },
    });

    expect(body.querySelector('header.site-nav')).not.toBeNull();
    expect(body.querySelector('footer.site-footer')).not.toBeNull();

    const main = body.querySelector('main#top');
    expect(main).not.toBeNull();
    expect(main?.querySelector('[data-slot-marker]')).not.toBeNull();

    // SiteNav must come before main, and SiteFooter after it (document order).
    const bodyChildren = Array.from(body.children);
    const navIndex = bodyChildren.findIndex((el) => el.matches('header.site-nav'));
    const mainIndex = bodyChildren.findIndex((el) => el.matches('main#top'));
    const footerIndex = bodyChildren.findIndex((el) => el.matches('footer.site-footer'));
    expect(navIndex).toBeGreaterThanOrEqual(0);
    expect(navIndex).toBeLessThan(mainIndex);
    expect(mainIndex).toBeLessThan(footerIndex);
  });

  it('renders the given title and an optional meta description', async () => {
    const body = await renderToBody(BaseLayout, {
      props: { locale: 'en', title: 'letsylabs — test', description: 'A test description.' },
    });
    const doc = body.ownerDocument;
    expect(doc.title).toBe('letsylabs — test');
    expect(doc.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
      'A test description.',
    );
  });

  it('omits the meta description tag when none is given', async () => {
    const body = await renderToBody(BaseLayout, { props: { locale: 'en', title: 'no-desc' } });
    expect(body.ownerDocument.querySelector('meta[name="description"]')).toBeNull();
  });

  it('sets html[lang] to the given locale', async () => {
    const body = await renderToBody(BaseLayout, { props: { locale: 'es', title: 'letsylabs' } });
    expect(body.ownerDocument.documentElement.getAttribute('lang')).toBe('es');
  });
});
