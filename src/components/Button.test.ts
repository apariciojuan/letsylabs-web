import { getByRole, getByText } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';
import { renderToBody } from '../test/render-astro';
import Button from './Button.astro';

describe('Button', () => {
  it('renders a primary button with the arrow and the slotted label', async () => {
    const body = await renderToBody(Button, { slots: { default: 'Get early access' } });
    const button = getByRole(body, 'button', { name: /get early access/i });
    expect(button.className).toContain('btn-primary');
    expect(getByText(button, '▸')).toBeTruthy();
  });

  it('renders as an <a> when href is given (still reachable/clickable without JS)', async () => {
    const body = await renderToBody(Button, {
      props: { href: '/pricing', variant: 'ghost' },
      slots: { default: 'Read the docs' },
    });
    const link = getByRole(body, 'link', { name: /read the docs/i });
    expect(link.getAttribute('href')).toBe('/pricing');
    expect(link.className).toContain('btn-ghost');
  });

  it('omits the arrow when arrow={false}', async () => {
    const body = await renderToBody(Button, {
      props: { arrow: false },
      slots: { default: 'Submit' },
    });
    expect(body.querySelector('.btn-arrow')).toBeNull();
  });

  it('defaults to type="button" (not "submit") so it never accidentally submits a form', async () => {
    const body = await renderToBody(Button, { slots: { default: 'Click me' } });
    const button = getByRole(body, 'button', { name: /click me/i });
    expect(button.getAttribute('type')).toBe('button');
  });

  it('supports type="submit" for form CTAs (the early-access waitlist form)', async () => {
    const body = await renderToBody(Button, {
      props: { type: 'submit' },
      slots: { default: 'Get early access' },
    });
    const button = getByRole(body, 'button', { name: /get early access/i });
    expect(button.getAttribute('type')).toBe('submit');
  });
});
