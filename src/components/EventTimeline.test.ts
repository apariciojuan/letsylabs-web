import { describe, expect, it } from 'vitest';
import { renderToBody } from '../test/render-astro';
import EventTimeline from './EventTimeline.astro';

describe('EventTimeline', () => {
  it('joins ts/type/detail with " · " and colors the dot by accent', async () => {
    const body = await renderToBody(EventTimeline, {
      props: {
        events: [
          { ts: '00:02', type: 'stt.partial', detail: '118ms', accent: 'event' },
          { type: 'agent.first_token', detail: '210ms', accent: 'signal' },
        ],
      },
    });
    const rows = body.querySelectorAll('.event-timeline-row');
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toBe('00:02 · stt.partial · 118ms');
    expect(rows[0].querySelector('.event-timeline-dot')?.className).toContain('event-timeline-dot-event');
    expect(rows[1].textContent).toBe('agent.first_token · 210ms');
    expect(rows[1].querySelector('.event-timeline-dot')?.className).toContain('event-timeline-dot-signal');
  });

  it('defaults the dot to muted when no accent is given', async () => {
    const body = await renderToBody(EventTimeline, { props: { events: [{ type: 'call.ended' }] } });
    expect(body.querySelector('.event-timeline-dot')?.className).toContain('event-timeline-dot-muted');
  });

  it('renders an empty list without throwing (edge path)', async () => {
    const body = await renderToBody(EventTimeline, { props: { events: [] } });
    expect(body.querySelectorAll('.event-timeline-row')).toHaveLength(0);
  });
});
