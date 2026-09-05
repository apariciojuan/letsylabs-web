// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initCopyButtons } from './code-block';

function makeButton(text: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.dataset.copyButton = '';
  button.dataset.copyText = text;
  button.dataset.copyIdleLabel = 'copy';
  button.dataset.copyDoneLabel = 'copied ✓';
  button.textContent = 'copy';
  document.body.appendChild(button);
  return button;
}

describe('initCopyButtons', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('copies data-copy-text to the clipboard and flips the label to "copied ✓"', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const button = makeButton('curl https://api.letsylabs.com');
    const stop = initCopyButtons(document, { clipboard: { writeText } });

    button.click();
    expect(writeText).toHaveBeenCalledWith('curl https://api.letsylabs.com');
    expect(button.textContent).toBe('copied ✓');

    stop();
  });

  it('restores the idle label after resetMs (1.6s per the handoff)', () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const button = makeButton('echo hi');
    initCopyButtons(document, { clipboard: { writeText }, resetMs: 1600 });

    button.click();
    expect(button.textContent).toBe('copied ✓');

    vi.advanceTimersByTime(1599);
    expect(button.textContent).toBe('copied ✓');

    vi.advanceTimersByTime(1);
    expect(button.textContent).toBe('copy');
  });

  it('does not throw when the clipboard write rejects (denied permission -- error path)', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    const button = makeButton('echo hi');
    initCopyButtons(document, { clipboard: { writeText } });

    expect(() => button.click()).not.toThrow();
    expect(button.textContent).toBe('copied ✓');
  });

  it('resets the timer on repeated clicks instead of stacking labels', () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const button = makeButton('echo hi');
    initCopyButtons(document, { clipboard: { writeText }, resetMs: 1000 });

    button.click();
    vi.advanceTimersByTime(600);
    button.click(); // resets the 1000ms window
    vi.advanceTimersByTime(600);
    expect(button.textContent).toBe('copied ✓'); // would have reset at 1000ms from the first click

    vi.advanceTimersByTime(400);
    expect(button.textContent).toBe('copy');
  });

  it('the stop() cleanup removes listeners so a later click is a no-op', () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const button = makeButton('echo hi');
    const stop = initCopyButtons(document, { clipboard: { writeText } });
    stop();

    button.click();
    expect(writeText).not.toHaveBeenCalled();
    expect(button.textContent).toBe('copy');
  });
});
