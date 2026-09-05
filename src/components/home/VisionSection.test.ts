import { getByText } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';
import { renderToBody } from '../../test/render-astro';
import en from '../../i18n/en.json';
import es from '../../i18n/es.json';
import VisionSection from './VisionSection.astro';

describe('VisionSection', () => {
  it('renders the English H2, the 5-step line and the COMING badge', async () => {
    const body = await renderToBody(VisionSection, { props: { locale: 'en' } });
    expect(body.querySelector('h2')?.textContent).toBe(en.home.vision.h2);
    const steps = body.querySelectorAll('.vision-step');
    expect(steps).toHaveLength(5);
    expect(steps[0].textContent?.trim()).toBe(en.home.vision.steps.voice);
    expect(steps[0].className).toContain('vision-step-live');
    expect(steps[1].className).not.toContain('vision-step-live');
    expect(getByText(body, en.home.vision.comingBadge)).toBeTruthy();
  });

  it('renders the Spanish copy', async () => {
    const body = await renderToBody(VisionSection, { props: { locale: 'es' } });
    expect(body.querySelector('h2')?.textContent).toBe(es.home.vision.h2);
    expect(body.querySelector('.vision-step')?.textContent?.trim()).toBe(
      es.home.vision.steps.voice,
    );
  });

  it('only Voice carries the live dot', async () => {
    const body = await renderToBody(VisionSection, { props: { locale: 'en' } });
    expect(body.querySelectorAll('.vision-dot')).toHaveLength(1);
  });

  it('renders 4 connector lines between the 5 steps', async () => {
    const body = await renderToBody(VisionSection, { props: { locale: 'en' } });
    expect(body.querySelectorAll('.vision-connector')).toHaveLength(4);
  });
});
