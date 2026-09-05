/**
 * `EarlyAccessForm.astro`'s client-side behavior (brief W-7, spec D-W7-1/D-W7-2): progressive
 * enhancement over the native `<form method="POST">` -- without JavaScript the browser just POSTs
 * to `action` and the destination (Formspree, or the dev-only mock, `scripts/dev/waitlist-mock.mjs`)
 * shows its own confirmation. With JavaScript, `initEarlyAccessForm` intercepts `submit`, checks the
 * honeypot (`_gotcha`), sends the same `FormData` via `fetch` with `Accept: application/json`, and
 * flips a `role="status"` region between the pre-rendered success/error copy (already localized by
 * `EarlyAccessForm.astro` into `data-success-message`/`data-error-message` -- this module never
 * imports the i18n catalog itself, same convention as `code-block.ts`'s `data-copy-*-label`).
 *
 * `fetchImpl` is injectable (same pattern as `code-block.ts`'s `clipboard` option) so
 * `early-access-form.test.ts` can exercise the 200/422/network-error paths without touching a real
 * network call.
 */
import type { Locale } from '../i18n';

export interface ClassifiedResult {
  success: boolean;
}

/**
 * Pure: maps an HTTP status code to success/failure. D-W7-1 always shows the SAME generic error
 * copy regardless of the provider's response body (never a raw provider error to the user) -- the
 * response body is only read so a caller can log/inspect it if it ever needs to, not to change the
 * user-facing message.
 */
export function classifyResponse(status: number): ClassifiedResult {
  return { success: status >= 200 && status < 300 };
}

interface MailtoContent {
  subject: string;
  body: string;
}

// D-W7-1's three fields, precomposed into the mailto body -- kept in sync by hand with
// EarlyAccessForm.astro's <input name="..."> fields (email/country/building), same as every other
// hardcoded-string convention in this repo (i18n catalog, not a shared constant, since these two
// locales are the only ones with mailto copy today).
const MAILTO_CONTENT: Record<Locale, MailtoContent> = {
  en: {
    subject: 'Early access',
    body: 'Email: \nCountry: \nWhat are you building? \n',
  },
  es: {
    subject: 'Acceso anticipado',
    body: 'Email: \nPaís: \n¿Qué estás construyendo? \n',
  },
};

/**
 * Pure: builds the `mailto:hello@letsylabs.com?subject=...&body=...` link (D-W7-2), always
 * available next to the form (and alone, as the primary CTA, when there is no endpoint at all --
 * D-W7-1 fail-closed). `encodeURIComponent` on each part matches RFC 6068 (mailto URI) encoding.
 */
export function buildMailto(locale: Locale): string {
  const { subject, body } = MAILTO_CONTENT[locale];
  return `mailto:hello@letsylabs.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export interface InitEarlyAccessFormOptions {
  fetchImpl?: typeof fetch;
}

/**
 * Wires every `[data-early-access-form]` under `root`. Returns a cleanup function that removes the
 * listeners (same shape as `initCopyButtons`/`initReveal`).
 */
export function initEarlyAccessForm(
  root: ParentNode = document,
  options: InitEarlyAccessFormOptions = {},
): () => void {
  const fetchImpl = options.fetchImpl ?? (typeof fetch === 'function' ? fetch : undefined);
  const forms = Array.from(root.querySelectorAll<HTMLFormElement>('[data-early-access-form]'));
  const cleanups = forms.map((form) => wireForm(form, fetchImpl));
  return () => cleanups.forEach((cleanup) => cleanup());
}

function wireForm(form: HTMLFormElement, fetchImpl?: typeof fetch): () => void {
  const status = form.querySelector<HTMLElement>('[data-early-access-status]');
  const mailtoLink = form.querySelector<HTMLAnchorElement>('.eaf-mailto-link');

  const showMessage = (key: 'successMessage' | 'errorMessage') => {
    if (!status) return;
    status.textContent =
      (key === 'successMessage' ? status.dataset.successMessage : status.dataset.errorMessage) ??
      '';
  };

  const disableFields = () => {
    Array.from(form.elements).forEach((element) => {
      if (element instanceof HTMLInputElement || element instanceof HTMLButtonElement) {
        element.disabled = true;
      }
    });
  };

  const showSuccess = () => {
    showMessage('successMessage');
    disableFields();
  };

  const showError = () => {
    showMessage('errorMessage');
    mailtoLink?.focus();
  };

  const onSubmit = (event: SubmitEvent) => {
    event.preventDefault();

    // Honeypot (D-W7-1): a bot fills every field, including this one, hidden off-screen from real
    // users. A filled `_gotcha` never reaches the network -- pretend success and stop.
    const honeypot = form.elements.namedItem('_gotcha');
    if (honeypot instanceof HTMLInputElement && honeypot.value !== '') {
      showSuccess();
      return;
    }

    if (!fetchImpl) {
      showError();
      return;
    }

    const formData = new FormData(form);
    fetchImpl(form.action, {
      method: 'POST',
      body: formData,
      headers: { Accept: 'application/json' },
    })
      .then((response) => {
        const { success } = classifyResponse(response.status);
        if (success) showSuccess();
        else showError();
      })
      .catch(() => showError());
  };

  form.addEventListener('submit', onSubmit);
  return () => form.removeEventListener('submit', onSubmit);
}
