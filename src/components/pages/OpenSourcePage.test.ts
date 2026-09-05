import { getByRole, getByText } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';
import { renderToBody } from '../../test/render-astro';
import en from '../../i18n/en.json';
import es from '../../i18n/es.json';
import OpenSourcePage from './OpenSourcePage.astro';

describe('OpenSourcePage', () => {
  it('renders the English hero and the 3 crate cards with the honest "☆ —" placeholder', async () => {
    const body = await renderToBody(OpenSourcePage, { props: { locale: 'en' } });
    expect(getByRole(body, 'heading', { level: 1 }).textContent?.trim()).toBe(
      en.openSource.hero.h1,
    );
    expect(getByText(body, en.openSource.crates.types.name)).toBeTruthy();
    expect(getByText(body, en.openSource.crates.vad.name)).toBeTruthy();
    expect(getByText(body, en.openSource.crates.adapters.name)).toBeTruthy();
    expect(body.querySelectorAll('.os-crate-stars')).toHaveLength(3);
    body.querySelectorAll('.os-crate-stars').forEach((el) => expect(el.textContent).toBe('☆ —'));
  });

  it('renders the Spanish copy', async () => {
    const body = await renderToBody(OpenSourcePage, { props: { locale: 'es' } });
    expect(getByRole(body, 'heading', { level: 1 }).textContent?.trim()).toBe(
      es.openSource.hero.h1,
    );
  });

  it('the GitHub button is a disabled span with no href, next to a COMING SOON badge', async () => {
    const body = await renderToBody(OpenSourcePage, { props: { locale: 'en' } });
    const github = body.querySelector('.os-github-disabled');
    expect(github?.tagName).toBe('SPAN');
    expect(github?.getAttribute('aria-disabled')).toBe('true');
    expect(github?.closest('a')).toBeNull();
    expect(github?.textContent?.trim()).toBe(en.openSource.crates.githubLabel);
    const badges = body.querySelectorAll('.os-crates-footer .badge');
    expect(badges).toHaveLength(2);
    expect(badges[0].textContent).toBe('COMING SOON');
    expect(badges[1].textContent).toBe('LETSY-PY: 2027');
  });

  it('never renders a mailto: link disguised as GitHub', async () => {
    const body = await renderToBody(OpenSourcePage, { props: { locale: 'en' } });
    const anchors = Array.from(body.querySelectorAll('a'));
    const githubLike = anchors.find((a) => a.textContent?.includes('github.com'));
    expect(githubLike).toBeUndefined();
  });

  it('the ghost CTA (Get early access) points at pricing, localized', async () => {
    const enBody = await renderToBody(OpenSourcePage, { props: { locale: 'en' } });
    const enLinks = enBody.querySelectorAll('.page-hero-ctas a');
    expect(enLinks[0].getAttribute('href')).toBe('#crates');
    expect(enLinks[1].getAttribute('href')).toBe('/pricing');

    const esBody = await renderToBody(OpenSourcePage, { props: { locale: 'es' } });
    expect(esBody.querySelectorAll('.page-hero-ctas a')[1].getAttribute('href')).toBe(
      '/es/pricing',
    );
  });

  it('renders the 3-line philosophy block with a signal border', async () => {
    const body = await renderToBody(OpenSourcePage, { props: { locale: 'en' } });
    const block = body.querySelector('.os-philosophy-text');
    expect(block?.querySelectorAll('br').length).toBe(2);
    expect(body.textContent).toContain(en.openSource.philosophy.line1);
    expect(body.textContent).toContain(en.openSource.philosophy.line3);
  });
});
