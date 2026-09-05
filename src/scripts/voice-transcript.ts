/**
 * Voice section micro-demo transcript (brief W-3, W3-2a / "letsylabs Homepage.dc.html" lines
 * 599-607): a Spanish STT transcript appears word-by-word in a loop, one word every 380ms, wrapping
 * back to empty after a short pause (`(len + 4)` steps per loop, so the finished sentence lingers
 * for ~4 ticks before restarting -- exactly the prototype's `(i + 1) % (WORDS.length + 4)`).
 *
 * This transcript stays in Spanish in BOTH locales (decision, docs/plans/web/03_homepage.md): it is
 * a demo of the STT `es` language, not UI copy -- the `stt.final · es · 142ms` label next to it
 * makes that explicit. `WORDS` therefore lives here as a literal constant, not an i18n key, the same
 * way the hero/Developers code snippets are literal (decision: "Nombres de eventos, código y ticker
 * no se traducen").
 */
import { prefersReducedMotion } from './site-fx';

export const TRANSCRIPT_WORDS = 'Hola, quiero mover mi cita del jueves a la mañana.'.split(' ');

/** The words visible at step `i`: the first `min(i, words.length)` words, joined with spaces. */
export function transcriptAt(words: string[], i: number): string {
  const count = Math.min(Math.max(i, 0), words.length);
  return words.slice(0, count).join(' ');
}

/** Advances the loop index: `(i + 1) % (words.length + 4)`, so the full sentence lingers briefly. */
export function nextTranscriptIndex(i: number, wordCount: number): number {
  return (i + 1) % (wordCount + 4);
}

export interface VoiceTranscriptOptions {
  reduced?: boolean;
  intervalMs?: number;
  setIntervalFn?: typeof setInterval;
}

/**
 * Starts the word-by-word loop, writing into `el.textContent`. Under reduced motion the full
 * sentence is set once and the loop never starts (matching the README's "sin marquee/ecualizador"
 * reduced-motion rule). Returns a stop function.
 */
export function startVoiceTranscript(
  el: HTMLElement,
  words: string[] = TRANSCRIPT_WORDS,
  options: VoiceTranscriptOptions = {},
): () => void {
  const reduced = options.reduced ?? prefersReducedMotion();
  if (reduced) {
    el.textContent = words.join(' ');
    return () => {};
  }

  const intervalMs = options.intervalMs ?? 380;
  const setIntervalFn = options.setIntervalFn ?? setInterval;

  let i = 0;
  const interval = setIntervalFn(() => {
    i = nextTranscriptIndex(i, words.length);
    el.textContent = transcriptAt(words, i);
  }, intervalMs);

  return () => clearInterval(interval);
}
