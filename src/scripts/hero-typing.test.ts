// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { nextStep, startHeroTyping, typedSlice } from './hero-typing';

describe('typedSlice', () => {
  it('returns the first `step` characters', () => {
    expect(typedSlice('abcdef', 3)).toBe('abc');
  });

  it('clamps to the full string once step exceeds its length', () => {
    expect(typedSlice('abc', 999)).toBe('abc');
  });

  it('clamps to an empty string for a negative step', () => {
    expect(typedSlice('abc', -5)).toBe('');
  });
});

describe('nextStep', () => {
  it('advances by 2 characters by default (the prototype rate)', () => {
    expect(nextStep(0)).toBe(2);
    expect(nextStep(2)).toBe(4);
  });

  it('honors a custom charsPerStep', () => {
    expect(nextStep(10, 5)).toBe(15);
  });
});

function fixture() {
  document.body.innerHTML = `
    <pre data-highlighted>HIGHLIGHTED</pre>
    <pre data-typing hidden><span data-typed></span></pre>
  `;
  return {
    highlighted: document.querySelector<HTMLElement>('[data-highlighted]')!,
    typing: document.querySelector<HTMLElement>('[data-typing]')!,
    typedTarget: document.querySelector<HTMLElement>('[data-typed]')!,
  };
}

describe('startHeroTyping', () => {
  it('under reduced motion, never hides the highlighted element and never touches the typing element', () => {
    const elements = fixture();
    startHeroTyping('curl -X POST', elements, { reduced: true });
    expect(elements.highlighted.hidden).toBe(false);
    expect(elements.typing.hidden).toBe(true);
  });

  it('with motion allowed: hides highlighted, types the code, then restores highlighted after the delay', () => {
    vi.useFakeTimers();
    const elements = fixture();
    const code = 'curl';
    startHeroTyping(code, elements, { reduced: false, stepMs: 26, restoreDelayMs: 400 });

    expect(elements.highlighted.hidden).toBe(true);
    expect(elements.typing.hidden).toBe(false);

    vi.advanceTimersByTime(26);
    expect(elements.typedTarget.textContent).toBe(typedSlice(code, 2));

    vi.advanceTimersByTime(26); // step 4 -- reaches code.length (4), schedules the restore timeout
    expect(elements.typedTarget.textContent).toBe('curl');
    expect(elements.typing.hidden).toBe(false); // not yet restored -- still within the 400ms delay

    vi.advanceTimersByTime(400);
    expect(elements.typing.hidden).toBe(true);
    expect(elements.highlighted.hidden).toBe(false);
    vi.useRealTimers();
  });

  it('stop() clears the interval before it reaches the end', () => {
    vi.useFakeTimers();
    const elements = fixture();
    const stop = startHeroTyping('a much longer snippet of code', elements, {
      reduced: false,
      stepMs: 26,
    });
    vi.advanceTimersByTime(26);
    const typedAtStop = elements.typedTarget.textContent;
    stop();
    vi.advanceTimersByTime(1000);
    expect(elements.typedTarget.textContent).toBe(typedAtStop);
    vi.useRealTimers();
  });
});
