/**
 * Production scroll-reveal / counters / SVG pulses (brief W-2 entregable 5). Same behavior as the
 * handoff's reference `design_handoff_letsylabs_web/site-fx.js`, reimplemented for production:
 * `IntersectionObserver` (threshold ~0.12, reveals once) instead of the prototype's scroll+interval
 * rect-checking, which the handoff README explicitly calls a preview-environment workaround
 * ("en producción: IntersectionObserver threshold ~0.12, revelar una sola vez").
 *
 * Every effect is a no-op (or shows the final state immediately) under `prefers-reduced-motion:
 * reduce` -- checked once via `matchMedia` at `initFX()` time, not per-effect, matching the
 * handoff's "sin JS" safety requirement: none of these functions ever hide `[data-reveal]` content
 * by default. `initReveal`/`initCounters` only set an inline hidden starting style *after*
 * confirming JS is running and motion is allowed; without JavaScript (or under reduced motion) the
 * markup's own default styling/text is what renders, so content is never invisible waiting on a
 * script that didn't run. Regression covered by site-fx.test.ts ("does not hide reveal targets when
 * reduced motion is set").
 */

export interface SiteFxHandle {
  stop(): void;
}

export function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** 1 - (1-k)^3, k in [0,1] -- the counter's easing curve (handoff: "900ms ease-out cúbico"). */
export function easeOutCubic(k: number): number {
  return 1 - Math.pow(1 - k, 3);
}

const REVEAL_THRESHOLD = 0.12;
const REVEAL_DURATION_MS = 380;
const COUNTER_DURATION_MS = 900;

/**
 * Reveals `[data-reveal]` elements (fade + translateY(12px) -> visible) once each crosses
 * `REVEAL_THRESHOLD` of the viewport, staggered by their own `data-delay` (ms). No-op under reduced
 * motion (elements are left exactly as authored -- already visible).
 */
export function initReveal(
  root: ParentNode = document,
  reduced = prefersReducedMotion(),
): () => void {
  const elements = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
  if (elements.length === 0 || reduced) return () => {};

  elements.forEach((el) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(12px)';
    el.style.transition = `opacity ${REVEAL_DURATION_MS}ms ease-out, transform ${REVEAL_DURATION_MS}ms ease-out`;
  });

  const timers: ReturnType<typeof setTimeout>[] = [];
  const reveal = (el: HTMLElement) => {
    const delay = parseInt(el.dataset.delay ?? '0', 10);
    timers.push(
      setTimeout(() => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      }, delay),
    );
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          reveal(entry.target as HTMLElement);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: REVEAL_THRESHOLD },
  );
  elements.forEach((el) => observer.observe(el));

  return () => {
    observer.disconnect();
    timers.forEach((timer) => clearTimeout(timer));
  };
}

/**
 * Counts `[data-counter]` elements from 0 to their `data-target` over 900ms (ease-out cubic) once
 * each enters the viewport. `data-prefix`/`data-suffix` are literal strings prepended/appended
 * (e.g. prefix "<" + target 1 + suffix "s" => "<1s"). No-op under reduced motion (the element's own
 * markup already shows the final formatted value, matching the handoff's fixture pattern).
 */
export function initCounters(
  root: ParentNode = document,
  reduced = prefersReducedMotion(),
): () => void {
  const elements = Array.from(root.querySelectorAll<HTMLElement>('[data-counter]'));
  if (elements.length === 0) return () => {};

  const run = (el: HTMLElement) => {
    const target = parseInt(el.dataset.target ?? '0', 10);
    const prefix = el.dataset.prefix ?? '';
    const suffix = el.dataset.suffix ?? '';
    if (reduced) {
      el.textContent = `${prefix}${target}${suffix}`;
      return;
    }
    const start = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / COUNTER_DURATION_MS);
      el.textContent = `${prefix}${Math.round(target * easeOutCubic(k))}${suffix}`;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  if (reduced) {
    elements.forEach(run);
    return () => {};
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          run(entry.target as HTMLElement);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: REVEAL_THRESHOLD },
  );
  elements.forEach((el) => observer.observe(el));

  return () => observer.disconnect();
}

/**
 * Drives every `[data-pulse-dot="<id>"]` along its matching `[data-pulse-path="<id>"]` SVG path via
 * `getPointAtLength` in a `requestAnimationFrame` loop, at that path's own `data-pulse-ms` speed
 * (default 2600ms/loop). Under reduced motion the dots are hidden outright (handoff: "sin pulsos
 * (dots ocultos)") rather than frozen mid-path.
 */
export function initSvgPulses(
  root: ParentNode = document,
  reduced = prefersReducedMotion(),
): () => void {
  const paths = Array.from(root.querySelectorAll<SVGPathElement>('[data-pulse-path]'));
  if (paths.length === 0) return () => {};

  if (reduced) {
    root.querySelectorAll<SVGElement>('[data-pulse-dot]').forEach((dot) => {
      dot.setAttribute('display', 'none');
    });
    return () => {};
  }

  let raf: number;
  const loop = (time: number) => {
    paths.forEach((path) => {
      const id = path.dataset.pulsePath;
      const dot = id ? root.querySelector<SVGCircleElement>(`[data-pulse-dot="${id}"]`) : null;
      if (!dot) return;
      const speed = parseInt(path.dataset.pulseMs ?? '2600', 10);
      try {
        const length = path.getTotalLength();
        if (length > 0) {
          const point = path.getPointAtLength(((time / speed) % 1) * length);
          dot.setAttribute('cx', String(point.x));
          dot.setAttribute('cy', String(point.y));
        }
      } catch {
        // Path not (yet) laid out/renderable -- skip this frame, try again on the next one.
      }
    });
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  return () => cancelAnimationFrame(raf);
}

/** Wires reveal + counters + SVG pulses under `root` in one call; `stop()` tears down all three. */
export function initFX(root: ParentNode = document): SiteFxHandle {
  const reduced = prefersReducedMotion();
  const stopReveal = initReveal(root, reduced);
  const stopCounters = initCounters(root, reduced);
  const stopPulses = initSvgPulses(root, reduced);
  return {
    stop() {
      stopReveal();
      stopCounters();
      stopPulses();
    },
  };
}
