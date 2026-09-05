// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { buildMailto, classifyResponse, initEarlyAccessForm } from './early-access-form';

describe('buildMailto', () => {
  it('builds the exact EN mailto: from D-W7-2 (spec docs/specs/web_formulario_seguridad.md)', () => {
    expect(buildMailto('en')).toBe(
      'mailto:hello@letsylabs.com?subject=Early%20access&body=Email%3A%20%0ACountry%3A%20%0AWhat%20are%20you%20building%3F%20%0A',
    );
  });

  it('builds the Spanish mailto: with a translated subject and body', () => {
    const href = buildMailto('es');
    expect(href).toBe(
      'mailto:hello@letsylabs.com?subject=Acceso%20anticipado&body=Email%3A%20%0APa%C3%ADs%3A%20%0A%C2%BFQu%C3%A9%20est%C3%A1s%20construyendo%3F%20%0A',
    );
    // Decoded, it reads the way a human would type it.
    expect(decodeURIComponent(href)).toContain('subject=Acceso anticipado');
    expect(decodeURIComponent(href)).toContain('País:');
  });
});

describe('classifyResponse', () => {
  it('classifies any 2xx status as success', () => {
    expect(classifyResponse(200).success).toBe(true);
    expect(classifyResponse(201).success).toBe(true);
    expect(classifyResponse(299).success).toBe(true);
  });

  it('classifies 4xx/5xx as failure (D-W7-1: the exact status/body never changes the user message)', () => {
    expect(classifyResponse(422).success).toBe(false);
    expect(classifyResponse(500).success).toBe(false);
    expect(classifyResponse(0).success).toBe(false);
  });
});

function makeForm(): {
  form: HTMLFormElement;
  status: HTMLElement;
  mailtoLink: HTMLAnchorElement;
  emailInput: HTMLInputElement;
  honeypotInput: HTMLInputElement;
  submitButton: HTMLButtonElement;
} {
  document.body.innerHTML = `
    <form data-early-access-form action="/__dev/waitlist" method="POST">
      <input type="email" name="email" required />
      <input type="text" name="country" />
      <input type="text" name="building" />
      <input type="text" name="_gotcha" class="eaf-honeypot-input" />
      <button type="submit">Get early access</button>
      <a class="eaf-mailto-link" href="mailto:hello@letsylabs.com">Talk to us</a>
      <p
        data-early-access-status
        data-success-message="You're on the list ✓"
        data-error-message="Something went wrong — email us instead"
      ></p>
    </form>
  `;
  const form = document.querySelector('form') as HTMLFormElement;
  return {
    form,
    status: form.querySelector('[data-early-access-status]') as HTMLElement,
    mailtoLink: form.querySelector('.eaf-mailto-link') as HTMLAnchorElement,
    emailInput: form.querySelector('input[name="email"]') as HTMLInputElement,
    honeypotInput: form.querySelector('input[name="_gotcha"]') as HTMLInputElement,
    submitButton: form.querySelector('button[type="submit"]') as HTMLButtonElement,
  };
}

/** Submits the form the same way a real click would, without ever navigating jsdom. */
function submit(form: HTMLFormElement) {
  form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
}

describe('initEarlyAccessForm', () => {
  it('on a 2xx response, shows the success message and disables the fields', async () => {
    const { form, status, emailInput, submitButton } = makeForm();
    emailInput.value = 'you@company.com';
    const fetchImpl = vi.fn().mockResolvedValue({ status: 200 });
    const stop = initEarlyAccessForm(document, { fetchImpl });

    submit(form);
    await vi.waitFor(() => expect(status.textContent).toBe("You're on the list ✓"));

    // `form.action` (unlike `getAttribute('action')`) is the resolved absolute URL -- jsdom's
    // default origin is http://localhost:3000, matching real browser behavior for a relative
    // action="/__dev/waitlist".
    expect(fetchImpl).toHaveBeenCalledWith(
      'http://localhost:3000/__dev/waitlist',
      expect.objectContaining({ method: 'POST', headers: { Accept: 'application/json' } }),
    );
    expect(emailInput.disabled).toBe(true);
    expect(submitButton.disabled).toBe(true);
    stop();
  });

  it('on a 422 response, shows the error message and focuses the mailto: link', async () => {
    const { form, status, mailtoLink, emailInput } = makeForm();
    emailInput.value = 'fail@x.com';
    const fetchImpl = vi.fn().mockResolvedValue({ status: 422 });
    const stop = initEarlyAccessForm(document, { fetchImpl });

    submit(form);
    await vi.waitFor(() =>
      expect(status.textContent).toBe('Something went wrong — email us instead'),
    );
    expect(document.activeElement).toBe(mailtoLink);
    stop();
  });

  it('on a network error (fetch rejects), shows the error message', async () => {
    const { form, status, emailInput } = makeForm();
    emailInput.value = 'you@company.com';
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError('network down'));
    const stop = initEarlyAccessForm(document, { fetchImpl });

    submit(form);
    await vi.waitFor(() =>
      expect(status.textContent).toBe('Something went wrong — email us instead'),
    );
    stop();
  });

  it('honeypot filled: shows the success message WITHOUT calling fetch (D-W7-1)', async () => {
    const { form, status, honeypotInput } = makeForm();
    honeypotInput.value = 'i-am-a-bot';
    const fetchImpl = vi.fn();
    const stop = initEarlyAccessForm(document, { fetchImpl });

    submit(form);
    await vi.waitFor(() => expect(status.textContent).toBe("You're on the list ✓"));
    expect(fetchImpl).not.toHaveBeenCalled();
    stop();
  });

  it('is a no-op on a root with no [data-early-access-form] (mailto-only mode)', () => {
    document.body.innerHTML = '<div class="eaf-mailto-only"></div>';
    expect(() => initEarlyAccessForm(document)).not.toThrow();
  });

  it('stop() removes the submit listener', async () => {
    const { form } = makeForm();
    const fetchImpl = vi.fn().mockResolvedValue({ status: 200 });
    const stop = initEarlyAccessForm(document, { fetchImpl });
    stop();

    submit(form);
    // Give any (unexpected) async handler a tick to run before asserting it didn't.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
