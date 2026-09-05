import { getByText } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';
import { renderToBody } from '../test/render-astro';
import Eyebrow from './Eyebrow.astro';

describe('Eyebrow', () => {
  it('defaults to the signal (green) tone', async () => {
    const body = await renderToBody(Eyebrow, { slots: { default: 'REALTIME VOICE INFRASTRUCTURE FOR AI' } });
    const el = getByText(body, 'REALTIME VOICE INFRASTRUCTURE FOR AI');
    expect(el.className).toContain('eyebrow');
    expect(el.className).toContain('eyebrow-signal');
  });

  it('supports the amber (Telephony) tone', async () => {
    const body = await renderToBody(Eyebrow, { props: { tone: 'tel' }, slots: { default: 'TELEPHONY' } });
    expect(getByText(body, 'TELEPHONY').className).toContain('eyebrow-tel');
  });
});
