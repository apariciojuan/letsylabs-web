import { getByRole } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';
import { renderToBody } from '../test/render-astro';
import SectionHeading from './SectionHeading.astro';

describe('SectionHeading', () => {
  it('renders an <h1> for level="hero"', async () => {
    const body = await renderToBody(SectionHeading, {
      props: { level: 'hero' },
      slots: { default: 'Give your AI a voice.' },
    });
    const heading = getByRole(body, 'heading', { level: 1 });
    expect(heading.textContent).toBe('Give your AI a voice.');
  });

  it('renders an <h2> for the default level="section"', async () => {
    const body = await renderToBody(SectionHeading, { slots: { default: 'Bring your own intelligence.' } });
    const heading = getByRole(body, 'heading', { level: 2 });
    expect(heading.className).not.toContain('h2-minor');
  });

  it('adds the .h2-minor modifier for level="minor" (smaller H2, e.g. the Vision block)', async () => {
    const body = await renderToBody(SectionHeading, {
      props: { level: 'minor' },
      slots: { default: 'Voice is the first sense.' },
    });
    const heading = getByRole(body, 'heading', { level: 2 });
    expect(heading.className).toContain('h2-minor');
  });

  it('centers the heading when centered={true}', async () => {
    const body = await renderToBody(SectionHeading, { props: { centered: true }, slots: { default: 'x' } });
    expect(getByRole(body, 'heading', { level: 2 }).className).toContain('section-heading-centered');
  });
});
