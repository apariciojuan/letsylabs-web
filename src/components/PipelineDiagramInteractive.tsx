import { useEffect, useRef, useState } from 'react';
import { computePipelineGeometry } from './pipeline-geometry';

/**
 * Interactive pipeline diagram (brief W-2.6 / letsylabs_web_spec_diseno.md §2.7, §4.2): click a
 * source and a destination to reroute the highlighted path; a pulse dot (r=4, glow) travels the
 * active route on a loop. This is the one piece of the pipeline diagram family that is a React
 * island rather than plain Astro -- it owns real client state (which source/destination is
 * selected) and drives a live SVG animation via `getPointAtLength` + `requestAnimationFrame`, which
 * needs a real DOM; `PipelineDiagram.astro` (the static sibling) covers every non-interactive case
 * with zero client JS.
 *
 * The re-routing math itself (node x-positions, the active path's `d`) is the pure, thoroughly unit-
 * tested `computePipelineGeometry()` (pipeline-geometry.ts/.test.ts) -- this component is a thin
 * rendering + event-wiring shell around it. Its own click-driven behavior is verified by
 * e2e/pipeline-diagram.spec.ts (real browser) rather than a jsdom+React unit test: without
 * `@testing-library/react` (not added -- see task-W-2-report.md), manually driving React state
 * updates through raw `dispatchEvent` in jsdom is exactly the kind of fragile, `act()`-wrapping-
 * dependent test the brief's "e2e si no es viable" clause exists for.
 *
 * `prefers-reduced-motion` hides the pulse dot outright (checked once on mount/geometry change) --
 * the static edges/nodes and click-to-reroute behavior stay fully functional either way.
 */
export interface PipelineInteractiveNode {
  id: string;
  label: string;
}

export interface PipelineDiagramInteractiveProps {
  sources: PipelineInteractiveNode[];
  destinations: PipelineInteractiveNode[];
  centerLabel: string;
  centerSubLabel: string;
  hint: string;
  ariaLabel: string;
  pulseMs?: number;
}

const NODE_WIDTH = 150;
const NODE_HEIGHT = 44;
const DEST_WIDTH = 160;
const CENTER = { x: 230, y: 150, width: 340, height: 90 };
const ACTIVE_STROKE = 'rgba(74, 242, 161, 0.65)';
const INACTIVE_STROKE = 'rgba(255, 255, 255, 0.09)';

function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function PipelineDiagramInteractive({
  sources,
  destinations,
  centerLabel,
  centerSubLabel,
  hint,
  ariaLabel,
  pulseMs = 2600,
}: PipelineDiagramInteractiveProps) {
  const [selectedSource, setSelectedSource] = useState(0);
  const [selectedDestination, setSelectedDestination] = useState(0);
  const pathRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);

  const geometry = computePipelineGeometry({
    sourceCount: sources.length,
    destinationCount: destinations.length,
    selectedSource,
    selectedDestination,
  });

  useEffect(() => {
    const dot = dotRef.current;
    const path = pathRef.current;
    if (!dot || !path) return undefined;

    if (prefersReducedMotion()) {
      dot.style.display = 'none';
      return undefined;
    }
    dot.style.display = '';

    let raf: number;
    const loop = (time: number) => {
      try {
        const length = path.getTotalLength();
        if (length > 0) {
          const point = path.getPointAtLength(((time / pulseMs) % 1) * length);
          dot.setAttribute('cx', String(point.x));
          dot.setAttribute('cy', String(point.y));
        }
      } catch {
        // Path not laid out yet -- retry on the next frame.
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [geometry.activePath, pulseMs]);

  return (
    // React island, not an Astro component, so there is no scoped <style> block available -- the
    // wrapper/SVG/hint layout (as opposed to each node/edge's own presentation, already inline
    // above) is styled inline here for the same reason. Without an explicit width/height reset an
    // SVG with only a `viewBox` renders at its browser-default intrinsic size (300x150 CSS px),
    // which would make the whole diagram tiny; found and fixed during review before this ever
    // shipped (no dedicated regression test -- this is a layout/visual concern, verified by the
    // dev QA page's visual pass against the handoff, per the brief's own verification strategy for
    // this class of component).
    <div className="pipeline-interactive" style={{ maxWidth: 860 }}>
      <svg
        viewBox="0 0 800 400"
        role="img"
        aria-label={ariaLabel}
        className="pipeline-interactive-svg"
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        {geometry.sourceX.map((x, i) => (
          <path
            key={`source-edge-${sources[i]?.id ?? i}`}
            d={`M ${x} 60 C ${x} 105 400 105 400 150`}
            style={{
              fill: 'none',
              stroke: i === selectedSource ? ACTIVE_STROKE : INACTIVE_STROKE,
              strokeWidth: 1.5,
            }}
          />
        ))}
        {geometry.destX.map((x, i) => (
          <path
            key={`dest-edge-${destinations[i]?.id ?? i}`}
            d={`M 400 240 C 400 295 ${x} 295 ${x} 340`}
            style={{
              fill: 'none',
              stroke: i === selectedDestination ? ACTIVE_STROKE : INACTIVE_STROKE,
              strokeWidth: 1.5,
            }}
          />
        ))}
        <path ref={pathRef} d={geometry.activePath} style={{ fill: 'none', stroke: 'none' }} />
        {sources.map((source, i) => {
          const x = geometry.sourceX[i];
          const active = i === selectedSource;
          return (
            <g
              key={source.id}
              onClick={() => setSelectedSource(i)}
              style={{ cursor: 'pointer' }}
              data-testid={`pipeline-source-${source.id}`}
              role="button"
              tabIndex={0}
              aria-pressed={active}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') setSelectedSource(i);
              }}
            >
              <rect
                x={x - NODE_WIDTH / 2}
                y={16}
                width={NODE_WIDTH}
                height={NODE_HEIGHT}
                rx={8}
                style={{
                  fill: active ? '#0F1B16' : '#0D1117',
                  stroke: active ? '#4AF2A1' : 'rgba(255,255,255,0.14)',
                  strokeWidth: 1,
                }}
              />
              <text
                x={x}
                y={38}
                textAnchor="middle"
                dominantBaseline="central"
                style={{
                  fill: active ? '#E8EDF2' : '#8B96A5',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 14,
                }}
              >
                {source.label}
              </text>
            </g>
          );
        })}
        <rect
          x={CENTER.x}
          y={CENTER.y}
          width={CENTER.width}
          height={CENTER.height}
          rx={12}
          style={{ fill: '#0D1117', stroke: 'rgba(74,242,161,0.4)', strokeWidth: 1 }}
        />
        <text
          x={400}
          y={185}
          textAnchor="middle"
          style={{
            fill: '#E8EDF2',
            fontFamily: 'var(--font-display)',
            fontSize: 17,
            fontWeight: 600,
          }}
        >
          {centerLabel}
        </text>
        <text
          x={400}
          y={212}
          textAnchor="middle"
          style={{ fill: '#8B96A5', fontFamily: 'var(--font-mono)', fontSize: 11.5 }}
        >
          {centerSubLabel}
        </text>
        {destinations.map((dest, i) => {
          const x = geometry.destX[i];
          const active = i === selectedDestination;
          return (
            <g
              key={dest.id}
              onClick={() => setSelectedDestination(i)}
              style={{ cursor: 'pointer' }}
              data-testid={`pipeline-destination-${dest.id}`}
              role="button"
              tabIndex={0}
              aria-pressed={active}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') setSelectedDestination(i);
              }}
            >
              <rect
                x={x - DEST_WIDTH / 2}
                y={340}
                width={DEST_WIDTH}
                height={NODE_HEIGHT}
                rx={8}
                style={{
                  fill: active ? '#0F1B16' : '#0D1117',
                  stroke: active ? '#4AF2A1' : 'rgba(255,255,255,0.14)',
                  strokeWidth: 1,
                }}
              />
              <text
                x={x}
                y={362}
                textAnchor="middle"
                dominantBaseline="central"
                style={{
                  fill: active ? '#E8EDF2' : '#8B96A5',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 13.5,
                }}
              >
                {dest.label}
              </text>
            </g>
          );
        })}
        <circle
          ref={dotRef}
          r={4}
          cx={geometry.sourceX[selectedSource]}
          cy={60}
          style={{ fill: '#4AF2A1', filter: 'drop-shadow(0 0 6px #4AF2A1)' }}
        />
      </svg>
      <div
        className="pipeline-interactive-hint"
        style={{
          textAlign: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '1.5px',
          color: '#8B96A5',
          marginTop: 8,
        }}
      >
        {hint}
      </div>
    </div>
  );
}
