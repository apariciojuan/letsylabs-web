import { describe, expect, it } from 'vitest';
import { renderToBody } from '../test/render-astro';
import BaseLayout from './BaseLayout.astro';

const BASE_PROPS = {
  locale: 'en' as const,
  title: 'letsylabs — test',
  description: 'A test page.',
};

describe('BaseLayout', () => {
  it('mounts SiteNav and SiteFooter around the slotted content, under main#top', async () => {
    const body = await renderToBody(BaseLayout, {
      props: BASE_PROPS,
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

  it('renders the given title and meta description (required, brief W-8)', async () => {
    const body = await renderToBody(BaseLayout, {
      props: { locale: 'en', title: 'letsylabs — test', description: 'A test description.' },
    });
    const doc = body.ownerDocument;
    expect(doc.title).toBe('letsylabs — test');
    expect(doc.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
      'A test description.',
    );
  });

  it('sets html[lang] to the given locale', async () => {
    const body = await renderToBody(BaseLayout, { props: { ...BASE_PROPS, locale: 'es' } });
    expect(body.ownerDocument.documentElement.getAttribute('lang')).toBe('es');
  });

  it('renders an absolute canonical link and robots/OG/twitter metadata (brief W-8)', async () => {
    const body = await renderToBody(BaseLayout, { props: BASE_PROPS });
    const doc = body.ownerDocument;

    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://letsylabs.com/',
    );
    expect(doc.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('index,follow');
    expect(doc.querySelector('meta[property="og:title"]')?.getAttribute('content')).toBe(
      BASE_PROPS.title,
    );
    expect(doc.querySelector('meta[property="og:description"]')?.getAttribute('content')).toBe(
      BASE_PROPS.description,
    );
    expect(doc.querySelector('meta[property="og:url"]')?.getAttribute('content')).toBe(
      'https://letsylabs.com/',
    );
    expect(doc.querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe(
      'https://letsylabs.com/og/home-en.png',
    );
    expect(doc.querySelector('meta[property="og:locale"]')?.getAttribute('content')).toBe('en_US');
    expect(doc.querySelector('meta[property="og:locale:alternate"]')?.getAttribute('content')).toBe(
      'es_ES',
    );
    expect(doc.querySelector('meta[name="twitter:card"]')?.getAttribute('content')).toBe(
      'summary_large_image',
    );
    expect(doc.querySelector('link[rel="icon"]')?.getAttribute('href')).toBe('/favicon.svg');
  });

  it('renders absolute hreflang alternates for en/es/x-default', async () => {
    const body = await renderToBody(BaseLayout, { props: BASE_PROPS });
    const doc = body.ownerDocument;
    const links = Array.from(doc.querySelectorAll('link[rel="alternate"][hreflang]'));
    const byHreflang = Object.fromEntries(
      links.map((link) => [link.getAttribute('hreflang'), link.getAttribute('href')]),
    );
    expect(byHreflang).toEqual({
      en: 'https://letsylabs.com/',
      es: 'https://letsylabs.com/es/',
      'x-default': 'https://letsylabs.com/',
    });
  });

  it('preloads the 2 above-the-fold font weights (brief W-8, LCP)', async () => {
    const body = await renderToBody(BaseLayout, { props: BASE_PROPS });
    const preloads = Array.from(
      body.ownerDocument.querySelectorAll('link[rel="preload"][as="font"]'),
    );
    const hrefs = preloads.map((link) => link.getAttribute('href'));
    expect(hrefs).toContain('/fonts/space-grotesk-600.ttf');
    expect(hrefs).toContain('/fonts/inter-400.ttf');
    expect(preloads.every((link) => link.hasAttribute('crossorigin'))).toBe(true);
  });

  it('omits the JSON-LD script tag when jsonLd is not given', async () => {
    const body = await renderToBody(BaseLayout, { props: BASE_PROPS });
    expect(body.ownerDocument.querySelector('script[type="application/ld+json"]')).toBeNull();
  });

  it('renders the given jsonLd object as a script[type="application/ld+json"]', async () => {
    const body = await renderToBody(BaseLayout, {
      props: { ...BASE_PROPS, jsonLd: { '@context': 'https://schema.org', '@type': 'Thing' } },
    });
    const script = body.ownerDocument.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    expect(JSON.parse(script?.textContent ?? '')).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Thing',
    });
  });
});
