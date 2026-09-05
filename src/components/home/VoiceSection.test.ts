import { getByText } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';
import { renderToBody } from '../../test/render-astro';
import en from '../../i18n/en.json';
import es from '../../i18n/es.json';
import VoiceSection from './VoiceSection.astro';

describe('VoiceSection', () => {
  it('renders the 4 event-labeled cards in English', async () => {
    const body = await renderToBody(VoiceSection, { props: { locale: 'en' } });
    expect(body.querySelector('h2')?.textContent).toBe(en.home.voice.h2);
    expect(getByText(body, en.home.voice.cards.stt.title)).toBeTruthy();
    expect(getByText(body, en.home.voice.cards.tts.title)).toBeTruthy();
    expect(getByText(body, en.home.voice.cards.turns.title)).toBeTruthy();
    expect(getByText(body, en.home.voice.cards.latency.title)).toBeTruthy();
    expect(body.textContent).toContain('stt.partial');
  });

  it('renders the Spanish cards', async () => {
    const body = await renderToBody(VoiceSection, { props: { locale: 'es' } });
    expect(body.querySelector('h2')?.textContent).toBe(es.home.voice.h2);
    expect(getByText(body, es.home.voice.cards.stt.title)).toBeTruthy();
  });

  it('renders the 8-bar equalizer and the transcript placeholder + cursor', async () => {
    const body = await renderToBody(VoiceSection, { props: { locale: 'en' } });
    expect(body.querySelectorAll('.voice-eq-bar')).toHaveLength(8);
    expect(body.querySelector('[data-voice-transcript]')).not.toBeNull();
    expect(body.querySelector('.blink-cursor')).not.toBeNull();
  });

  it('the transcript label stays the fixed Spanish STT demo tag regardless of locale', async () => {
    const enBody = await renderToBody(VoiceSection, { props: { locale: 'en' } });
    const esBody = await renderToBody(VoiceSection, { props: { locale: 'es' } });
    expect(enBody.querySelector('.voice-transcript-label')?.textContent).toBe(
      'stt.final · es · 142ms',
    );
    expect(esBody.querySelector('.voice-transcript-label')?.textContent).toBe(
      'stt.final · es · 142ms',
    );
  });

  it('each card carries data-reveal (regression coverage for the Card forwarding fix)', async () => {
    const body = await renderToBody(VoiceSection, { props: { locale: 'en' } });
    expect(body.querySelectorAll('.card[data-reveal]').length).toBeGreaterThanOrEqual(5);
  });
});
