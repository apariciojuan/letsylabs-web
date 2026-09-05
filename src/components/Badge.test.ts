import { getByText } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';
import { renderToBody } from '../test/render-astro';
import Badge from './Badge.astro';

describe('Badge', () => {
  it('renders the slotted label and defaults to variant "coming-soon"', async () => {
    const body = await renderToBody(Badge, { slots: { default: 'COMING SOON' } });
    const badge = getByText(body, 'COMING SOON');
    expect(badge.className).toContain('badge-coming-soon');
  });

  it.each([
    ['available', 'AVAILABLE'],
    ['preview', 'PREVIEW'],
    ['beta', 'BETA'],
    ['post-ga', 'POST-GA'],
  ] as const)('renders the %s variant with its own class', async (variant, label) => {
    const body = await renderToBody(Badge, { props: { variant }, slots: { default: label } });
    const badge = getByText(body, label);
    expect(badge.className).toContain(`badge-${variant}`);
  });
});
