// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import {
  nextTranscriptIndex,
  startVoiceTranscript,
  transcriptAt,
  TRANSCRIPT_WORDS,
} from './voice-transcript';

describe('transcriptAt', () => {
  const words = ['Hola', 'mundo', 'de', 'voz'];

  it('returns the first i words joined by spaces', () => {
    expect(transcriptAt(words, 0)).toBe('');
    expect(transcriptAt(words, 1)).toBe('Hola');
    expect(transcriptAt(words, 2)).toBe('Hola mundo');
  });

  it('clamps at the full sentence once i exceeds the word count', () => {
    expect(transcriptAt(words, 999)).toBe('Hola mundo de voz');
  });

  it('clamps to empty for a negative i', () => {
    expect(transcriptAt(words, -3)).toBe('');
  });
});

describe('nextTranscriptIndex', () => {
  it('wraps around after wordCount + 4 steps (the sentence lingers, then restarts)', () => {
    const wordCount = 4;
    let i = 0;
    for (let step = 1; step <= wordCount + 4; step++) {
      i = nextTranscriptIndex(i, wordCount);
      expect(i).toBe(step % (wordCount + 4));
    }
    // One more step wraps back to 0.
    expect(nextTranscriptIndex(wordCount + 3, wordCount)).toBe(0);
  });
});

describe('TRANSCRIPT_WORDS', () => {
  it('is the fixed Spanish STT demo sentence (stays Spanish in both locales)', () => {
    expect(TRANSCRIPT_WORDS.join(' ')).toBe('Hola, quiero mover mi cita del jueves a la mañana.');
  });
});

describe('startVoiceTranscript', () => {
  it('under reduced motion, sets the full sentence once and never schedules an interval', () => {
    document.body.innerHTML = '<span data-transcript></span>';
    const el = document.querySelector<HTMLElement>('[data-transcript]')!;
    const setIntervalFn = vi.fn();
    startVoiceTranscript(el, ['Hola', 'mundo'], { reduced: true, setIntervalFn });
    expect(el.textContent).toBe('Hola mundo');
    expect(setIntervalFn).not.toHaveBeenCalled();
  });

  it('with motion allowed, advances the transcript on each tick', () => {
    vi.useFakeTimers();
    document.body.innerHTML = '<span data-transcript></span>';
    const el = document.querySelector<HTMLElement>('[data-transcript]')!;
    startVoiceTranscript(el, ['Hola', 'mundo'], { reduced: false, intervalMs: 380 });

    expect(el.textContent).toBe('');
    vi.advanceTimersByTime(380);
    expect(el.textContent).toBe('Hola');
    vi.advanceTimersByTime(380);
    expect(el.textContent).toBe('Hola mundo');
    vi.useRealTimers();
  });

  it('stop() clears the interval', () => {
    vi.useFakeTimers();
    document.body.innerHTML = '<span data-transcript></span>';
    const el = document.querySelector<HTMLElement>('[data-transcript]')!;
    const stop = startVoiceTranscript(el, ['Hola', 'mundo'], { reduced: false, intervalMs: 380 });
    vi.advanceTimersByTime(380);
    stop();
    const textAtStop = el.textContent;
    vi.advanceTimersByTime(2000);
    expect(el.textContent).toBe(textAtStop);
    vi.useRealTimers();
  });
});
