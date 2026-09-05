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

  // Brief W-9 / CLAIMS_MATRIX rule 6 / CU-W9-2: `claimState="target"` is how a `target`-state row's
  // page satisfies the check_claims.mjs DOM ratchet -- without it, no badge in the built HTML is
  // machine-verifiable as a target marker.
  it('does not stamp data-claim-state by default', async () => {
    const body = await renderToBody(Badge, { slots: { default: 'COMING SOON' } });
    expect(getByText(body, 'COMING SOON').hasAttribute('data-claim-state')).toBe(false);
  });

  it('stamps data-claim-state="target" when claimState="target" is passed', async () => {
    const body = await renderToBody(Badge, {
      props: { claimState: 'target' },
      slots: { default: 'TARGET' },
    });
    expect(getByText(body, 'TARGET').getAttribute('data-claim-state')).toBe('target');
  });
});
