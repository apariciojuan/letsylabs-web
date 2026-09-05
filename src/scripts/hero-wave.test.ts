// @vitest-environment jsdom
// jsdom provides real requestAnimationFrame/cancelAnimationFrame globals; several cases below
// exercise initHeroWave's default parameters (no explicit *Fn override), which reference those
// globals directly.
import { describe, expect, it, vi } from 'vitest';
import { computeBars, initHeroWave } from './hero-wave';

describe('computeBars', () => {
  it('places one 3px-wide bar every 7px across the given width', () => {
    const bars = computeBars(70, 180, 0);
    expect(bars).toHaveLength(10);
    bars.forEach((bar, i) => {
      expect(bar.x).toBe(i * 7);
      expect(bar.width).toBe(3);
    });
  });

  it('at t=0, i=0 the sine term is exactly 0 -- floor height (2px) and base opacity (0.1)', () => {
    const [bar0] = computeBars(7, 180, 0);
    expect(bar0.height).toBe(2);
    expect(bar0.opacity).toBeCloseTo(0.1, 5);
  });

  it('centers each bar vertically: y + height/2 == canvasHeight/2', () => {
    const bars = computeBars(140, 200, 123);
    for (const bar of bars) {
      expect(bar.y + bar.height / 2).toBeCloseTo(100, 5);
    }
  });

  it('never produces a bar shorter than 2px (the floor from the prototype)', () => {
    for (let t = 0; t < 2000; t += 137) {
      for (const bar of computeBars(280, 180, t)) {
        expect(bar.height).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('is a pure function of (width, height, t) -- same inputs, same output', () => {
    expect(computeBars(100, 180, 450)).toEqual(computeBars(100, 180, 450));
  });
});

describe('initHeroWave', () => {
  function fakeCanvas(size: { clientWidth?: number; clientHeight?: number } = {}) {
    const fillRectCalls: unknown[][] = [];
    const ctx = {
      setTransform: vi.fn(),
      clearRect: vi.fn(),
      fillRect: vi.fn((...args: unknown[]) => fillRectCalls.push(args)),
      fillStyle: '',
    };
    const canvas = {
      clientWidth: size.clientWidth ?? 70,
      clientHeight: size.clientHeight ?? 180,
      width: 0,
      height: 0,
      getContext: () => ctx,
    } as unknown as HTMLCanvasElement;
    return { canvas, ctx, fillRectCalls };
  }

  it('under reduced motion, draws exactly one static frame and never requests another', () => {
    const { canvas, ctx } = fakeCanvas();
    const raf = vi.fn();
    initHeroWave(canvas, { reduced: true, requestAnimationFrameFn: raf });
    expect(ctx.clearRect).toHaveBeenCalledTimes(1);
    expect(raf).not.toHaveBeenCalled();
  });

  it('with motion allowed, loops via requestAnimationFrame', () => {
    const { canvas, ctx } = fakeCanvas();
    let callback: FrameRequestCallback | undefined;
    const raf = vi.fn((cb: FrameRequestCallback) => {
      callback = cb;
      return 1;
    });
    const stop = initHeroWave(canvas, { reduced: false, requestAnimationFrameFn: raf });
    // Registering the first frame doesn't draw synchronously -- only the (fake) rAF callback does.
    expect(raf).toHaveBeenCalledTimes(1);
    expect(ctx.clearRect).not.toHaveBeenCalled();

    callback?.(16);
    expect(raf).toHaveBeenCalledTimes(2);
    expect(ctx.clearRect).toHaveBeenCalledTimes(1);

    callback?.(32);
    expect(raf).toHaveBeenCalledTimes(3);
    expect(ctx.clearRect).toHaveBeenCalledTimes(2);
    stop();
  });

  it('stop() cancels the pending animation frame', () => {
    const { canvas } = fakeCanvas();
    const caf = vi.fn();
    const stop = initHeroWave(canvas, {
      reduced: false,
      requestAnimationFrameFn: () => 42,
      cancelAnimationFrameFn: caf,
    });
    stop();
    expect(caf).toHaveBeenCalledWith(42);
  });

  it('skips drawing (no throw) when the canvas has no layout size yet', () => {
    const { canvas, ctx } = fakeCanvas({ clientWidth: 0, clientHeight: 0 });
    expect(() => initHeroWave(canvas, { reduced: true })).not.toThrow();
    expect(ctx.clearRect).not.toHaveBeenCalled();
  });
});
