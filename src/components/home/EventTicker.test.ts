import { describe, expect, it } from 'vitest';
import { renderToBody } from '../../test/render-astro';
import en from '../../i18n/en.json';
import es from '../../i18n/es.json';
import EventTicker from './EventTicker.astro';

describe('EventTicker', () => {
  it('renders 8 literal items in each of the two duplicated groups (marquee)', async () => {
    const body = await renderToBody(EventTicker, { props: { locale: 'en' } });
    const groups = body.querySelectorAll('.ticker-group');
    expect(groups).toHaveLength(2);
    expect(groups[0].querySelectorAll('.ticker-item')).toHaveLength(8);
    expect(groups[1].querySelectorAll('.ticker-item')).toHaveLength(8);
    expect(groups[0].textContent).toContain('stt.partial · 118ms');
    expect(groups[0].textContent).toContain('turn.barge_in · 61ms');
  });

  it('the second group is aria-hidden (decorative duplicate for the marquee loop)', async () => {
    const body = await renderToBody(EventTicker, { props: { locale: 'en' } });
    const groups = body.querySelectorAll('.ticker-group');
    expect(groups[1].getAttribute('aria-hidden')).toBe('true');
    expect(groups[0].hasAttribute('aria-hidden')).toBe(false);
  });

  it('event item text is identical regardless of locale (not translated, decision)', async () => {
    const enBody = await renderToBody(EventTicker, { props: { locale: 'en' } });
    const esBody = await renderToBody(EventTicker, { props: { locale: 'es' } });
    expect(enBody.querySelector('.ticker-group')?.textContent).toBe(
      esBody.querySelector('.ticker-group')?.textContent,
    );
  });

  // Bug found in W-9 audit: this ticker's 6 latency items (118ms/142ms/210ms/96ms/1.2s/61ms) had NO
  // illustrative/target marking at all, unlike the Developers section's badged counters.
  it('stamps data-claim-state="target" on the 6 items with an unmeasured latency, not on "ok"/DTMF (CU-W9-2)', async () => {
    const body = await renderToBody(EventTicker, { props: { locale: 'en' } });
    const visibleGroup = body.querySelectorAll('.ticker-group')[0];
    const targetItems = visibleGroup.querySelectorAll('.ticker-item[data-claim-state="target"]');
    expect(targetItems).toHaveLength(6);
    const nonTargetItems = visibleGroup.querySelectorAll('.ticker-item:not([data-claim-state])');
    expect(nonTargetItems).toHaveLength(2);
    expect(
      Array.from(nonTargetItems).some((el) => el.textContent?.includes('call.transfer.human')),
    ).toBe(true);
    expect(Array.from(nonTargetItems).some((el) => el.textContent?.includes('dtmf.received'))).toBe(
      true,
    );
  });

  it('the container aria-label is translated', async () => {
    const enBody = await renderToBody(EventTicker, { props: { locale: 'en' } });
    const esBody = await renderToBody(EventTicker, { props: { locale: 'es' } });
    expect(enBody.querySelector('[role="group"]')?.getAttribute('aria-label')).toBe(
      en.home.ticker.ariaLabel,
    );
    expect(esBody.querySelector('[role="group"]')?.getAttribute('aria-label')).toBe(
      es.home.ticker.ariaLabel,
    );
  });
});
