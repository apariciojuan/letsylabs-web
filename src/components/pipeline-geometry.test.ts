import { describe, expect, it } from 'vitest';
import { computePipelineGeometry } from './pipeline-geometry';

describe('computePipelineGeometry', () => {
  it('reproduces the exact node positions and path from "letsylabs Homepage.dc.html" (src=0, dst=0)', () => {
    const geometry = computePipelineGeometry({
      sourceCount: 3,
      destinationCount: 4,
      selectedSource: 0,
      selectedDestination: 0,
    });
    expect(geometry.sourceX).toEqual([180, 400, 620]);
    expect(geometry.destX).toEqual([130, 310, 490, 670]);
    expect(geometry.activePath).toBe(
      'M 180 60 C 180 105 400 105 400 150 L 400 240 C 400 295 130 295 130 340',
    );
  });

  it('reroutes when a different source/destination is selected (src=2 "Your app", dst=3 "Any LLM")', () => {
    const geometry = computePipelineGeometry({
      sourceCount: 3,
      destinationCount: 4,
      selectedSource: 2,
      selectedDestination: 3,
    });
    expect(geometry.activePath).toBe(
      'M 620 60 C 620 105 400 105 400 150 L 400 240 C 400 295 670 295 670 340',
    );
  });

  it('every source/destination combination produces a distinct path', () => {
    const paths = new Set<string>();
    for (let src = 0; src < 3; src++) {
      for (let dst = 0; dst < 4; dst++) {
        paths.add(
          computePipelineGeometry({
            sourceCount: 3,
            destinationCount: 4,
            selectedSource: src,
            selectedDestination: dst,
          }).activePath,
        );
      }
    }
    expect(paths.size).toBe(12);
  });

  it('supports a different node count (generic reuse, e.g. 2 sources / 2 destinations)', () => {
    const geometry = computePipelineGeometry({
      sourceCount: 2,
      destinationCount: 2,
      selectedSource: 0,
      selectedDestination: 1,
      centerX: 400,
      sourceSpacing: 220,
      destSpacing: 180,
    });
    expect(geometry.sourceX).toEqual([290, 510]);
    expect(geometry.destX).toEqual([310, 490]);
  });
});
