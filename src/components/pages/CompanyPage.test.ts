import { getByRole, getByText } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';
import { renderToBody } from '../../test/render-astro';
import en from '../../i18n/en.json';
import es from '../../i18n/es.json';
import CompanyPage from './CompanyPage.astro';

describe('CompanyPage', () => {
  it('renders the English statement hero with no sub and no CTA row', async () => {
    const body = await renderToBody(CompanyPage, { props: { locale: 'en' } });
    expect(getByRole(body, 'heading', { level: 1 }).textContent?.trim()).toBe(
      en.company.hero.statement,
    );
    expect(body.querySelector('.page-hero-sub')).toBeNull();
    expect(body.querySelector('.page-hero-ctas')).toBeNull();
  });

  it('renders the Spanish copy', async () => {
    const body = await renderToBody(CompanyPage, { props: { locale: 'es' } });
    expect(getByRole(body, 'heading', { level: 1 }).textContent?.trim()).toBe(
      es.company.hero.statement,
    );
  });

  it('renders exactly 4 principles, numbered 01-04 in order, with no hover transition', async () => {
    const body = await renderToBody(CompanyPage, { props: { locale: 'en' } });
    const cards = body.querySelectorAll('.company-principles-grid > .card');
    expect(cards).toHaveLength(4);
    cards.forEach((card) => expect(card.className).not.toContain('card-hoverable'));

    const numbers = Array.from(body.querySelectorAll('.company-principle-number')).map(
      (el) => el.textContent,
    );
    expect(numbers).toEqual(['01', '02', '03', '04']);

    expect(getByText(body, en.company.principles.byoIntelligence.title)).toBeTruthy();
    expect(getByText(body, en.company.principles.complianceInfra.title)).toBeTruthy();
    expect(getByText(body, en.company.principles.sovereignty.title)).toBeTruthy();
    expect(getByText(body, en.company.principles.noSmoke.title)).toBeTruthy();
  });

  it('renders no <img> anywhere on the page (no stock photos, per the handoff)', async () => {
    const body = await renderToBody(CompanyPage, { props: { locale: 'en' } });
    expect(body.querySelectorAll('img')).toHaveLength(0);
  });

  it('renders the contact line with a mailto: link (email not translated)', async () => {
    const enBody = await renderToBody(CompanyPage, { props: { locale: 'en' } });
    const enLink = enBody.querySelector('.company-contact-line a');
    expect(enLink?.getAttribute('href')).toBe('mailto:hello@letsylabs.com');
    expect(enLink?.textContent).toBe('hello@letsylabs.com');

    const esBody = await renderToBody(CompanyPage, { props: { locale: 'es' } });
    const esLink = esBody.querySelector('.company-contact-line a');
    expect(esLink?.textContent).toBe('hello@letsylabs.com');
  });
});
