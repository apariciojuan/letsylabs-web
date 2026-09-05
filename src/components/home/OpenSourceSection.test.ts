import { getByText } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';
import { renderToBody } from '../../test/render-astro';
import en from '../../i18n/en.json';
import es from '../../i18n/es.json';
import OpenSourceSection from './OpenSourceSection.astro';

describe('OpenSourceSection', () => {
  it('renders the English H2/text, 3 crate cards with license/language chips, and the roadmap badge', async () => {
    const body = await renderToBody(OpenSourceSection, { props: { locale: 'en' } });
    expect(body.querySelector('h2')?.textContent).toBe(en.home.openSource.h2);
    expect(getByText(body, 'letsy-types')).toBeTruthy();
    expect(getByText(body, 'letsy-vad')).toBeTruthy();
    expect(getByText(body, 'letsy-adapters')).toBeTruthy();
    expect(body.querySelectorAll('.opensource-chip')).toHaveLength(6);
    expect(getByText(body, en.home.openSource.pythonBindings)).toBeTruthy();
  });

  it('renders the Spanish card descriptions', async () => {
    const body = await renderToBody(OpenSourceSection, { props: { locale: 'es' } });
    expect(getByText(body, es.home.openSource.cards.types.text)).toBeTruthy();
  });

  it('license/language chip text (Apache-2.0/Rust) is identical regardless of locale', async () => {
    const enBody = await renderToBody(OpenSourceSection, { props: { locale: 'en' } });
    const esBody = await renderToBody(OpenSourceSection, { props: { locale: 'es' } });
    expect(enBody.querySelector('.opensource-chip')?.textContent).toBe('Apache-2.0');
    expect(esBody.querySelector('.opensource-chip')?.textContent).toBe('Apache-2.0');
  });
});
