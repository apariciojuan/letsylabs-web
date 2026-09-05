/**
 * Wires every `[data-copy-button]` on the page (one per CodeBlock instance that was given a
 * `copyText`): click copies `data-copy-text` to the clipboard and flips the button's label from
 * `data-copy-idle-label` to `data-copy-done-label` ("copied ✓") for `resetMs` (1.6s per the
 * handoff), then restores it. Progressive enhancement only -- CodeBlock.astro renders the idle
 * label directly into the button, so without JavaScript the button is inert but the code itself
 * stays fully visible/selectable.
 */
export interface InitCopyButtonsOptions {
  resetMs?: number;
  clipboard?: Pick<Clipboard, 'writeText'>;
}

export function initCopyButtons(
  root: ParentNode,
  options: InitCopyButtonsOptions = {},
): () => void {
  const resetMs = options.resetMs ?? 1600;
  const clipboard =
    options.clipboard ?? (typeof navigator !== 'undefined' ? navigator.clipboard : undefined);

  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-copy-button]'));
  const timers = new Map<HTMLButtonElement, ReturnType<typeof setTimeout>>();

  const onClick = (button: HTMLButtonElement) => () => {
    const text = button.dataset.copyText ?? '';
    const doneLabel = button.dataset.copyDoneLabel ?? 'copied ✓';
    const idleLabel = button.dataset.copyIdleLabel ?? button.textContent ?? 'copy';

    clipboard?.writeText?.(text)?.catch(() => {
      /* clipboard permission denied or unsupported -- the label still flips so the user gets
         feedback; there is nothing actionable to surface for a copy-to-clipboard convenience
         button. */
    });

    button.textContent = doneLabel;
    const existing = timers.get(button);
    if (existing !== undefined) clearTimeout(existing);
    timers.set(
      button,
      setTimeout(() => {
        button.textContent = idleLabel;
        timers.delete(button);
      }, resetMs),
    );
  };

  const handlers = buttons.map((button) => {
    const handler = onClick(button);
    button.addEventListener('click', handler);
    return { button, handler };
  });

  return () => {
    handlers.forEach(({ button, handler }) => button.removeEventListener('click', handler));
    timers.forEach((timer) => clearTimeout(timer));
    timers.clear();
  };
}
