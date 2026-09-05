/**
 * Hero waveform canvas (brief W-3, W3-1a / "letsylabs Homepage.dc.html" lines 561-581): thin green
 * bars every 7px, 3px wide, driven by two composed sines so the waveform looks alive rather than
 * uniform. `computeBars` is the pure per-frame math (no canvas/DOM), unit-tested directly;
 * `initHeroWave` is the thin canvas-drawing/rAF wiring around it.
 *
 * `prefers-reduced-motion` renders a single static frame at t=600 (the prototype's own choice) with
 * no `requestAnimationFrame` loop — canvas content is the one motion primitive this repo's "solo
 * canvas/CSS transform" rule explicitly allows, but a *looping* canvas still needs the reduced-
 * motion fallback like everything else (repo rule 5).
 */
import { prefersReducedMotion } from './site-fx';

export interface WaveBar {
  x: number;
  y: number;
  width: number;
  height: number;
  /** rgba(74,242,161,<opacity>) alpha channel. */
  opacity: number;
}

const BAR_STEP = 7;
const BAR_WIDTH = 3;
const MIN_BAR_HEIGHT = 2;

/** One frame of the waveform, given the canvas CSS size and the animation clock `t` (ms). */
export function computeBars(width: number, height: number, t: number): WaveBar[] {
  const count = Math.floor(width / BAR_STEP);
  const bars: WaveBar[] = [];
  for (let i = 0; i < count; i++) {
    const v =
      Math.abs(Math.sin(i * 0.32 + t / 420)) *
      (0.25 + 0.75 * Math.abs(Math.sin(i * 0.11 + t / 900)));
    const barHeight = Math.max(MIN_BAR_HEIGHT, v * height * 0.85);
    bars.push({
      x: i * BAR_STEP,
      y: (height - barHeight) / 2,
      width: BAR_WIDTH,
      height: barHeight,
      opacity: 0.1 + v * 0.5,
    });
  }
  return bars;
}

export interface HeroWaveOptions {
  reduced?: boolean;
  requestAnimationFrameFn?: typeof requestAnimationFrame;
  cancelAnimationFrameFn?: typeof cancelAnimationFrame;
}

/**
 * Draws `computeBars()` onto `canvas` every frame (DPR 2, matching the prototype), or a single
 * static frame under reduced motion. Returns a stop function; safe to call when the canvas has no
 * layout size yet (a zero-size frame is simply skipped, retried on the next tick).
 */
export function initHeroWave(canvas: HTMLCanvasElement, options: HeroWaveOptions = {}): () => void {
  const reduced = options.reduced ?? prefersReducedMotion();
  const raf = options.requestAnimationFrameFn ?? requestAnimationFrame;
  const caf = options.cancelAnimationFrameFn ?? cancelAnimationFrame;
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  const draw = (t: number) => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    if (canvas.width !== w * 2) {
      canvas.width = w * 2;
      canvas.height = h * 2;
    }
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    ctx.clearRect(0, 0, w, h);
    for (const bar of computeBars(w, h, t)) {
      ctx.fillStyle = `rgba(74,242,161,${bar.opacity.toFixed(2)})`;
      ctx.fillRect(bar.x, bar.y, bar.width, bar.height);
    }
  };

  if (reduced) {
    draw(600);
    return () => {};
  }

  let frame: number;
  const loop = (t: number) => {
    draw(t);
    frame = raf(loop);
  };
  frame = raf(loop);
  return () => caf(frame);
}
