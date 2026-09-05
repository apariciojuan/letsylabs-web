import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderToBody } from '../test/render-astro';
import PipelineDiagram from './PipelineDiagram.astro';

const SOURCE_PATH = path.resolve(__dirname, 'PipelineDiagram.astro');

const baseProps = {
  ariaLabel:
    'Interactive pipeline diagram: audio sources connect through the letsylabs runtime to your agent or any LLM',
  description:
    'Audio from Phone, Browser or Your app flows into the letsylabs runtime, then to your agent or any LLM.',
  nodes: [
    { id: 'phone', label: 'Phone', x: 105, y: 16 },
    { id: 'browser', label: 'Browser', x: 325, y: 16 },
  ],
  edges: [
    {
      id: 'phone-runtime',
      path: 'M 180 60 C 180 105 400 105 400 150',
      accent: 'signal' as const,
      pulse: true,
      pulseStart: { x: 180, y: 60 },
    },
    { id: 'runtime-dest', path: 'M 400 240 C 400 295 130 295 130 340' },
  ],
  centerBox: {
    x: 230,
    y: 150,
    width: 340,
    height: 90,
    label: 'letsylabs runtime',
    subLabel: 'VAD · STT · turns · TTS · trace',
  },
};

describe('PipelineDiagram', () => {
  it('renders role="img" with the given aria-label, and a visually-hidden text description', async () => {
    const body = await renderToBody(PipelineDiagram, { props: baseProps });
    const svg = body.querySelector('svg[role="img"]');
    expect(svg?.getAttribute('aria-label')).toBe(baseProps.ariaLabel);
    expect(body.querySelector('figcaption')?.textContent).toBe(baseProps.description);
  });

  it('renders one node <rect>+<text> per node, and one <path> per edge', async () => {
    const body = await renderToBody(PipelineDiagram, { props: baseProps });
    expect(body.querySelectorAll('.pipeline-node')).toHaveLength(2);
    expect(body.querySelectorAll('.pipeline-edge')).toHaveLength(2);
    expect(body.querySelector('.pipeline-node-label')?.textContent).toBe('Phone');
  });

  it('colors an edge by its accent (signal/tel/event) and leaves accent-less edges neutral', async () => {
    const body = await renderToBody(PipelineDiagram, { props: baseProps });
    const edges = body.querySelectorAll('.pipeline-edge');
    // `.className` on an SVG element is an `SVGAnimatedString` at runtime (jsdom included), but
    // `lib.dom.d.ts` types it as a plain `string` -- use `getAttribute('class')` instead, which is
    // both correctly typed and unambiguous across HTML and SVG elements.
    expect(edges[0].getAttribute('class')).toContain('pipeline-edge-signal');
    expect(edges[1].getAttribute('class')).not.toMatch(/pipeline-edge-(signal|tel|event)/);
  });

  it('renders a pulse dot only for edges with pulse=true, positioned at its static fallback (cx/cy)', async () => {
    const body = await renderToBody(PipelineDiagram, { props: baseProps });
    const dots = body.querySelectorAll('.pipeline-pulse-dot');
    expect(dots).toHaveLength(1);
    expect(dots[0].getAttribute('cx')).toBe('180');
    expect(dots[0].getAttribute('cy')).toBe('60');
  });

  it('renders the center runtime box label/sub-label when centerBox is given', async () => {
    const body = await renderToBody(PipelineDiagram, { props: baseProps });
    expect(body.querySelector('.pipeline-runtime-label')?.textContent?.trim()).toBe('letsylabs runtime');
    expect(body.querySelector('.pipeline-runtime-sublabel')?.textContent?.trim()).toBe(
      'VAD · STT · turns · TTS · trace',
    );
  });

  it('defaults to size="md" and supports sm/lg', async () => {
    const md = await renderToBody(PipelineDiagram, { props: baseProps });
    expect(md.querySelector('.pipeline-diagram')?.className).toContain('pipeline-diagram-md');
    const sm = await renderToBody(PipelineDiagram, { props: { ...baseProps, size: 'sm' } });
    expect(sm.querySelector('.pipeline-diagram')?.className).toContain('pipeline-diagram-sm');
  });

  it('regression guard: the pulse dot is hidden outright under prefers-reduced-motion (CSS-only, no client JS)', () => {
    const source = readFileSync(SOURCE_PATH, 'utf8');
    expect(source).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
    const reducedMotionBlock = source.slice(source.indexOf('@media (prefers-reduced-motion: reduce)'));
    expect(reducedMotionBlock).toMatch(/\.pipeline-pulse-dot\s*{\s*display:\s*none;/);
  });
});
