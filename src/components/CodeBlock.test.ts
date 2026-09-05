import { getByRole, getByText } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';
import { renderToBody } from '../test/render-astro';
import CodeBlock from './CodeBlock.astro';

describe('CodeBlock', () => {
  it('renders the 3 header dots, the language label and the slotted body', async () => {
    const body = await renderToBody(CodeBlock, {
      props: { language: 'bash' },
      slots: { default: '<pre>curl -X POST /v1/sessions</pre>' },
    });
    expect(body.querySelectorAll('.code-block-dot')).toHaveLength(3);
    expect(getByText(body, 'bash')).toBeTruthy();
    expect(body.querySelector('pre')?.textContent).toBe('curl -X POST /v1/sessions');
  });

  it('renders a copy button carrying data-copy-text when copyText is given (CodeBlock usage)', async () => {
    const body = await renderToBody(CodeBlock, {
      props: { language: 'bash', copyText: 'curl -X POST /v1/sessions' },
      slots: { default: '<pre>curl -X POST /v1/sessions</pre>' },
    });
    const button = getByRole(body, 'button', { name: 'copy' });
    expect(button.dataset.copyText).toBe('curl -X POST /v1/sessions');
    expect(button.dataset.copyDoneLabel).toBe('copied ✓');
  });

  it('omits the copy button when copyText is not given (Terminal usage, e.g. Self-host)', async () => {
    const body = await renderToBody(CodeBlock, {
      props: { language: 'your-server' },
      slots: { default: '<div>$ docker compose up -d</div>' },
    });
    expect(body.querySelector('[data-copy-button]')).toBeNull();
  });

  it('supports custom idle/done labels (for i18n callers)', async () => {
    const body = await renderToBody(CodeBlock, {
      props: { language: 'bash', copyText: 'x', copyIdleLabel: 'copiar', copyDoneLabel: 'copiado ✓' },
      slots: { default: '<pre>x</pre>' },
    });
    expect(getByRole(body, 'button', { name: 'copiar' })).toBeTruthy();
  });
});
