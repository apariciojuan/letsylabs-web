import { getByText } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';
import { renderToBody } from '../../test/render-astro';
import en from '../../i18n/en.json';
import es from '../../i18n/es.json';
import PipelineSection from './PipelineSection.astro';

describe('PipelineSection', () => {
  it('renders the English H2/text/hint and the interactive diagram with translated node labels', async () => {
    const body = await renderToBody(PipelineSection, { props: { locale: 'en' } });
    expect(body.querySelector('h2')?.textContent).toBe(en.home.pipeline.h2);
    expect(getByText(body, en.home.pipeline.text)).toBeTruthy();
    expect(body.textContent).toContain(en.home.pipeline.hint);
    expect(body.textContent).toContain('Phone');
    expect(body.textContent).toContain('Your agent');
  });

  it('renders the Spanish H2/text/hint and translated node labels', async () => {
    const body = await renderToBody(PipelineSection, { props: { locale: 'es' } });
    expect(body.querySelector('h2')?.textContent).toBe(es.home.pipeline.h2);
    expect(body.textContent).toContain(es.home.pipeline.hint);
    expect(body.textContent).toContain('Teléfono');
    expect(body.textContent).toContain('Tu agente');
  });

  it('the diagram aria-label goes through i18n (brief requirement)', async () => {
    const body = await renderToBody(PipelineSection, { props: { locale: 'en' } });
    const svg = body.querySelector('svg[role="img"]');
    expect(svg?.getAttribute('aria-label')).toBe(en.home.pipeline.ariaLabel);
  });
});
