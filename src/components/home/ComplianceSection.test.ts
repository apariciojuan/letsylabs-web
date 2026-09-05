import { getByText } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';
import { renderToBody } from '../../test/render-astro';
import en from '../../i18n/en.json';
import es from '../../i18n/es.json';
import ComplianceSection from './ComplianceSection.astro';

describe('ComplianceSection', () => {
  it('renders the English H2/text and all 4 mini-cards with their icons', async () => {
    const body = await renderToBody(ComplianceSection, { props: { locale: 'en' } });
    expect(body.querySelector('h2')?.textContent).toBe(en.home.compliance.h2);
    expect(getByText(body, en.home.compliance.text)).toBeTruthy();
    expect(body.querySelectorAll('.compliance-card')).toHaveLength(4);
    expect(body.querySelectorAll('.compliance-card svg')).toHaveLength(4);
    expect(getByText(body, en.home.compliance.cards.disclosure.title)).toBeTruthy();
    expect(getByText(body, en.home.compliance.cards.retention.title)).toBeTruthy();
  });

  it('renders the exact Spanish H2 given by the design spec', async () => {
    const body = await renderToBody(ComplianceSection, { props: { locale: 'es' } });
    expect(body.querySelector('h2')?.textContent).toBe(
      'La ley ya lo exige. Nosotros lo traemos de serie.',
    );
    expect(body.querySelector('h2')?.textContent).toBe(es.home.compliance.h2);
  });

  it('links to the locale-appropriate /compliance route', async () => {
    const enBody = await renderToBody(ComplianceSection, { props: { locale: 'en' } });
    const esBody = await renderToBody(ComplianceSection, { props: { locale: 'es' } });
    expect(enBody.querySelector('.compliance-link')?.getAttribute('href')).toBe('/compliance');
    expect(esBody.querySelector('.compliance-link')?.getAttribute('href')).toBe('/es/compliance');
  });

  it('has no certification-seal imagery -- only the 4 line icons (honesty rule)', async () => {
    const body = await renderToBody(ComplianceSection, { props: { locale: 'en' } });
    expect(body.querySelector('img')).toBeNull();
  });
});
