export function initFX() {
  const rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stops = [];
  const els = Array.from(document.querySelectorAll('[data-reveal]'));
  if (!rm && els.length) {
    const pending = new Set(els);
    els.forEach(el => { el.style.opacity = '0'; el.style.transform = 'translateY(12px)'; el.style.transition = 'opacity .38s ease-out, transform .38s ease-out'; });
    const check = () => {
      const vh = document.documentElement.clientHeight;
      pending.forEach(el => {
        if (el.getBoundingClientRect().top < vh * 0.92) {
          pending.delete(el);
          const d = parseInt(el.dataset.delay || '0', 10);
          setTimeout(() => { el.style.opacity = '1'; el.style.transform = 'none'; }, d);
        }
      });
    };
    document.addEventListener('scroll', check, { passive: true, capture: true });
    window.addEventListener('resize', check);
    const int = setInterval(check, 500);
    check();
    stops.push(() => { document.removeEventListener('scroll', check, { capture: true }); window.removeEventListener('resize', check); clearInterval(int); });
  }
  const cs = new Set(document.querySelectorAll('[data-counter]'));
  if (cs.size) {
    const run = (el) => {
      const target = parseInt(el.dataset.target, 10);
      const pre = el.dataset.prefix ? '<' : '', suf = el.dataset.suffix || '';
      if (rm) { el.textContent = pre + target + suf; return; }
      const t0 = performance.now();
      const step = (now) => {
        const k = Math.min(1, (now - t0) / 900);
        el.textContent = pre + Math.round(target * (1 - Math.pow(1 - k, 3))) + suf;
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const check = () => {
      const vh = document.documentElement.clientHeight;
      cs.forEach(el => { if (el.getBoundingClientRect().top < vh * 0.9) { cs.delete(el); run(el); } });
    };
    document.addEventListener('scroll', check, { passive: true, capture: true });
    const int = setInterval(check, 500);
    check();
    stops.push(() => { document.removeEventListener('scroll', check, { capture: true }); clearInterval(int); });
  }
  const paths = Array.from(document.querySelectorAll('[data-pulse-path]'));
  if (paths.length) {
    if (rm) { document.querySelectorAll('[data-pulse-dot]').forEach(d => { d.style.display = 'none'; }); }
    else {
      let raf;
      const loop = (t) => {
        paths.forEach(p => {
          const dot = document.querySelector('[data-pulse-dot="' + p.dataset.pulsePath + '"]');
          if (!dot) return;
          const speed = parseInt(p.dataset.pulseMs || '2600', 10);
          try {
            const L = p.getTotalLength();
            if (L > 0) { const pt = p.getPointAtLength(((t / speed) % 1) * L); dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y); }
          } catch (e) {}
        });
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      stops.push(() => cancelAnimationFrame(raf));
    }
  }
  return { stop() { stops.forEach(f => f()); } };
}
