// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { easeOutCubic, initCounters, initReveal, initSvgPulses, prefersReducedMotion } from './site-fx';

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  callback: IntersectionObserverCallback;
  observed: Element[] = [];

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    FakeIntersectionObserver.instances.push(this);
  }

  observe(el: Element) {
    this.observed.push(el);
  }

  unobserve(el: Element) {
    this.observed = this.observed.filter((o) => o !== el);
  }

  disconnect() {
    this.observed = [];
  }

  trigger(el: Element, isIntersecting: boolean) {
    this.callback(
      [{ target: el, isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

function stubMatchMedia(reduced: boolean) {
  vi.stubGlobal(
    'matchMedia',
    (query: string) => ({ matches: reduced, media: query }) as unknown as MediaQueryList,
  );
}

function stubRaf() {
  let queue: FrameRequestCallback[] = [];
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    queue.push(cb);
    return queue.length;
  });
  vi.stubGlobal('cancelAnimationFrame', () => {});
  return {
    flush(time: number) {
      const callbacks = queue;
      queue = [];
      callbacks.forEach((cb) => cb(time));
    },
  };
}

beforeEach(() => {
  document.body.innerHTML = '';
  FakeIntersectionObserver.instances = [];
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('easeOutCubic', () => {
  it('starts at 0 and ends at 1', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
  });

  it('is monotonically increasing (a smoke check, not a full curve proof)', () => {
    expect(easeOutCubic(0.25)).toBeLessThan(easeOutCubic(0.5));
    expect(easeOutCubic(0.5)).toBeLessThan(easeOutCubic(0.75));
  });
});

describe('prefersReducedMotion', () => {
  it('reflects matchMedia(...).matches', () => {
    stubMatchMedia(true);
    expect(prefersReducedMotion()).toBe(true);
    stubMatchMedia(false);
    expect(prefersReducedMotion()).toBe(false);
  });
});

describe('initReveal', () => {
  it('does NOT touch elements under reduced motion (regression: must never rely on JS to become visible)', () => {
    document.body.innerHTML = '<div data-reveal>hero copy</div>';
    const el = document.querySelector<HTMLElement>('[data-reveal]')!;
    initReveal(document, true);
    expect(el.style.opacity).toBe('');
    expect(el.style.transform).toBe('');
  });

  it('hides then reveals each element once it crosses the threshold, honoring data-delay', () => {
    vi.useFakeTimers();
    document.body.innerHTML = '<div data-reveal data-delay="200">A</div>';
    const el = document.querySelector<HTMLElement>('[data-reveal]')!;
    initReveal(document, false);
    expect(el.style.opacity).toBe('0');
    expect(el.style.transform).toBe('translateY(12px)');

    const observer = FakeIntersectionObserver.instances[0];
    observer.trigger(el, true);
    // Still hidden until data-delay elapses.
    expect(el.style.opacity).toBe('0');
    vi.advanceTimersByTime(200);
    expect(el.style.opacity).toBe('1');
    expect(el.style.transform).toBe('none');
    vi.useRealTimers();
  });

  it('only reveals once (unobserves after the first intersection)', () => {
    document.body.innerHTML = '<div data-reveal>A</div>';
    const el = document.querySelector<HTMLElement>('[data-reveal]')!;
    initReveal(document, false);
    const observer = FakeIntersectionObserver.instances[0];
    observer.trigger(el, true);
    expect(observer.observed).not.toContain(el);
  });

  it('is a no-op when there are no [data-reveal] elements', () => {
    expect(() => initReveal(document, false)).not.toThrow();
    expect(FakeIntersectionObserver.instances).toHaveLength(0);
  });
});

describe('initCounters', () => {
  it('under reduced motion, sets the final formatted value immediately (no animation)', () => {
    document.body.innerHTML = '<div data-counter data-target="100" data-suffix="%">0%</div>';
    const el = document.querySelector<HTMLElement>('[data-counter]')!;
    initCounters(document, true);
    expect(el.textContent).toBe('100%');
  });

  it('counts up to the target with ease-out cubic over 900ms, then stops', () => {
    const raf = stubRaf();
    vi.spyOn(performance, 'now').mockReturnValue(0);
    document.body.innerHTML =
      '<div data-counter data-target="100" data-prefix="&lt;" data-suffix="s">&lt;1s</div>';
    const el = document.querySelector<HTMLElement>('[data-counter]')!;

    initCounters(document, false);
    FakeIntersectionObserver.instances[0].trigger(el, true);

    raf.flush(450); // k = 0.5
    expect(el.textContent).toBe(`<${Math.round(100 * easeOutCubic(0.5))}s`);

    raf.flush(900); // k = 1 -- final frame, stops requesting more
    expect(el.textContent).toBe('<100s');
  });

  it('is a no-op when there are no [data-counter] elements', () => {
    expect(() => initCounters(document, false)).not.toThrow();
  });
});

describe('initSvgPulses', () => {
  const SVG_NS = 'http://www.w3.org/2000/svg';

  function svgFixture() {
    const svg = document.createElementNS(SVG_NS, 'svg');
    const path = document.createElementNS(SVG_NS, 'path');
    path.dataset.pulsePath = 'a';
    path.dataset.pulseMs = '1000';
    (path as unknown as { getTotalLength: () => number }).getTotalLength = () => 10;
    (path as unknown as { getPointAtLength: (l: number) => { x: number; y: number } }).getPointAtLength = (
      l,
    ) => ({
      x: l,
      y: l * 2,
    });
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('data-pulse-dot', 'a');
    svg.append(path, dot);
    document.body.appendChild(svg);
    return { path, dot };
  }

  it('hides the dot outright under reduced motion (not just frozen mid-path)', () => {
    const { dot } = svgFixture();
    initSvgPulses(document, true);
    expect(dot.getAttribute('display')).toBe('none');
  });

  it('advances the dot along the path via getPointAtLength on each animation frame', () => {
    const raf = stubRaf();
    const { dot } = svgFixture();
    initSvgPulses(document, false);

    raf.flush(250); // (250/1000) % 1 = 0.25 -> length 10 -> point (2.5, 5)
    expect(dot.getAttribute('cx')).toBe('2.5');
    expect(dot.getAttribute('cy')).toBe('5');
  });

  it('is a no-op when there are no [data-pulse-path] elements', () => {
    expect(() => initSvgPulses(document, false)).not.toThrow();
  });
});
