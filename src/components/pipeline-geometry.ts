/**
 * Pure geometry for the interactive pipeline diagram (brief W-2.6): given how many sources/
 * destinations there are and which one of each is currently selected, computes the x-position of
 * every node plus the SVG path `d` for the active source -> runtime -> destination route.
 *
 * Extracted as a pure, DOM-free function (no React, no SVG APIs) specifically so the re-routing
 * logic has a fast, deterministic unit test independent of a real browser -- the actual pulsing dot
 * along that path (`getPointAtLength` in a `requestAnimationFrame` loop) needs a live DOM/SVG layout
 * engine and is covered by e2e instead (e2e/pipeline-diagram.spec.ts), per the brief's documented
 * "e2e si no es viable" fallback.
 *
 * Every default reproduces "letsylabs Homepage.dc.html" (lines 160-178) exactly for its
 * 3-source/4-destination pipeline: sources at x=180/400/620, destinations at x=130/310/490/670,
 * and the two Bezier control-point rows at y=105 (top) / y=295 (bottom) -- note the source/runtime
 * span (60->150, control y=105, the exact midpoint) and the runtime/destination span (240->340,
 * control y=295) are NOT symmetric in the original: 295 is 5px past the 290 midpoint. Rather than
 * approximate that with a formula, the control-point y's are their own overridable inputs.
 */
export interface PipelineGeometryInput {
  sourceCount: number;
  destinationCount: number;
  selectedSource: number;
  selectedDestination: number;
  centerX?: number;
  sourceSpacing?: number;
  destSpacing?: number;
  /** y of the source row / runtime box top / runtime box bottom / destination row (SVG units). */
  sourceY?: number;
  runtimeTopY?: number;
  runtimeBottomY?: number;
  destY?: number;
  /** y of the Bezier control points for the top (source->runtime) and bottom (runtime->dest) curves. */
  topControlY?: number;
  bottomControlY?: number;
}

export interface PipelineGeometry {
  sourceX: number[];
  destX: number[];
  /** SVG path `d` for the active source -> runtime -> destination route (for the pulse and the
   * highlighted edge alike). */
  activePath: string;
}

function evenlySpaced(count: number, center: number, spacing: number): number[] {
  return Array.from({ length: count }, (_, i) => center + (i - (count - 1) / 2) * spacing);
}

export function computePipelineGeometry(input: PipelineGeometryInput): PipelineGeometry {
  const {
    sourceCount,
    destinationCount,
    selectedSource,
    selectedDestination,
    centerX = 400,
    sourceSpacing = 220,
    destSpacing = 180,
    sourceY = 60,
    runtimeTopY = 150,
    runtimeBottomY = 240,
    destY = 340,
    topControlY = 105,
    bottomControlY = 295,
  } = input;

  const sourceX = evenlySpaced(sourceCount, centerX, sourceSpacing);
  const destX = evenlySpaced(destinationCount, centerX, destSpacing);
  const sx = sourceX[selectedSource];
  const dx = destX[selectedDestination];

  const activePath =
    `M ${sx} ${sourceY} C ${sx} ${topControlY} ${centerX} ${topControlY} ${centerX} ${runtimeTopY} ` +
    `L ${centerX} ${runtimeBottomY} C ${centerX} ${bottomControlY} ${dx} ${bottomControlY} ${dx} ${destY}`;

  return { sourceX, destX, activePath };
}
