import { describe, expect, it } from 'vitest';
import { renderToBody } from '../test/render-astro';
import Card from './Card.astro';

describe('Card', () => {
  it('renders the slotted content inside a default/hoverable card', async () => {
    const body = await renderToBody(Card, { slots: { default: '<p>Realtime STT</p>' } });
    const card = body.querySelector('.card');
    expect(card).not.toBeNull();
    expect(card?.className).toContain('card-default');
    expect(card?.className).toContain('card-hoverable');
    expect(card?.textContent).toContain('Realtime STT');
  });

  it('supports the amber (Telephony) tone', async () => {
    const body = await renderToBody(Card, { props: { tone: 'amber' }, slots: { default: 'x' } });
    expect(body.querySelector('.card')?.className).toContain('card-amber');
  });

  it('omits the hoverable class when hoverable={false}', async () => {
    const body = await renderToBody(Card, { props: { hoverable: false }, slots: { default: 'x' } });
    expect(body.querySelector('.card')?.className).not.toContain('card-hoverable');
  });
});
