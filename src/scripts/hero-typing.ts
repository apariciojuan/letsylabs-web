/**
 * Hero code-block typing effect (brief W-3, W3-1a / "letsylabs Homepage.dc.html" lines 551-559):
 * on first view (motion allowed), the plain-text snippet types in at 2 characters/26ms with a
 * blinking cursor; 400ms after the last character, the syntax-highlighted markup (already rendered
 * server-side) replaces it. Under reduced motion, or without JavaScript at all, the highlighted
 * version is what's there from the very first paint -- SSR renders it as the default, visible
 * state; this module only *hides* it in favor of the typing view when motion is allowed, and always
 * restores it afterwards.
 *
 * `typedSlice`/`nextStep` are the pure per-tick math (unit-tested directly); `startHeroTyping` is
 * the DOM wiring (two sibling elements toggled via `hidden`, matching the pattern already used by
 * SiteNav's mega menu/drawer).
 */
import { prefersReducedMotion } from './site-fx';

const STEP_MS = 26;
const CHARS_PER_STEP = 2;
const RESTORE_DELAY_MS = 400;

/** The plain-text content visible after `step` characters have "been typed". */
export function typedSlice(code: string, step: number): string {
  const clamped = Math.max(0, Math.min(step, code.length));
  return code.slice(0, clamped);
}

/** Advances the typing cursor by one tick (2 chars/26ms in the prototype). */
export function nextStep(step: number, charsPerStep: number = CHARS_PER_STEP): number {
  return step + charsPerStep;
}

export interface HeroTypingElements {
  /** The SSR, syntax-highlighted `<pre>` -- visible by default. */
  highlighted: HTMLElement;
  /** The plain-text `<pre>` typed into during the effect -- hidden by default. */
  typing: HTMLElement;
  /** The element inside `typing` whose text content is set to `typedSlice(code, step)`. */
  typedTarget: HTMLElement;
}

export interface HeroTypingOptions {
  reduced?: boolean;
  stepMs?: number;
  charsPerStep?: number;
  restoreDelayMs?: number;
  setIntervalFn?: typeof setInterval;
  clearIntervalFn?: typeof clearInterval;
  setTimeoutFn?: typeof setTimeout;
}

/**
 * Starts the typing effect for `code` against `elements`. Under reduced motion this is a no-op --
 * `elements.highlighted` is left exactly as rendered (visible), `elements.typing` untouched
 * (hidden). Returns a stop function that clears any pending interval/timeout (for cleanup on
 * unmount/navigation).
 */
export function startHeroTyping(
  code: string,
  elements: HeroTypingElements,
  options: HeroTypingOptions = {},
): () => void {
  const reduced = options.reduced ?? prefersReducedMotion();
  if (reduced) return () => {};

  const stepMs = options.stepMs ?? STEP_MS;
  const charsPerStep = options.charsPerStep ?? CHARS_PER_STEP;
  const restoreDelayMs = options.restoreDelayMs ?? RESTORE_DELAY_MS;
  const setIntervalFn = options.setIntervalFn ?? setInterval;
  const clearIntervalFn = options.clearIntervalFn ?? clearInterval;
  const setTimeoutFn = options.setTimeoutFn ?? setTimeout;

  elements.highlighted.hidden = true;
  elements.typing.hidden = false;

  let step = 0;
  const interval = setIntervalFn(() => {
    step = nextStep(step, charsPerStep);
    elements.typedTarget.textContent = typedSlice(code, step);
    if (step >= code.length) {
      clearIntervalFn(interval);
      setTimeoutFn(() => {
        elements.typing.hidden = true;
        elements.highlighted.hidden = false;
      }, restoreDelayMs);
    }
  }, stepMs);

  return () => clearIntervalFn(interval);
}
