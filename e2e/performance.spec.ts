import { expect, test } from '@playwright/test';

/**
 * Performance budget (brief W-8, entregable W8-2a, CU-W8-3): LCP < 2s, CLS < 0.05, measured on `/`
 * and `/es/` at 380px (the handoff's own mobile breakpoint, README §Técnica: "LCP < 2s").
 *
 * Method (documented per the brief's explicit request to state which was used): `lighthouse` is NOT
 * available in the `mcr.microsoft.com/playwright:v1.62.1-noble` image this repo's `e2e` service uses
 * (`require.resolve('lighthouse')` fails there -- checked directly, not assumed), and adding it would
 * be a new dependency outside this brief's "no new dependencies" rule. Per the brief's own documented
 * fallback, this measures the real Web Vitals directly via the standard
 * `PerformanceObserver` API (`largest-contentful-paint` and `layout-shift` entry types) inside the
 * page itself -- the same underlying browser instrumentation Lighthouse's own LCP/CLS metrics are
 * built on, just read without Lighthouse's aggregation layer around it.
 */

async function measureLcpAndCls(
  page: import('@playwright/test').Page,
  path: string,
): Promise<{ lcpMs: number; cls: number }> {
  await page.setViewportSize({ width: 380, height: 800 });
  await page.goto(path, { waitUntil: 'load' });
  return page.evaluate(
    () =>
      new Promise<{ lcpMs: number; cls: number }>((resolve) => {
        let lcpMs = 0;
        let cls = 0;

        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const last = entries[entries.length - 1];
          if (last) lcpMs = last.startTime;
        }).observe({ type: 'largest-contentful-paint', buffered: true });

        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            // `hadRecentInput`/`value` are layout-shift-specific fields not yet in every lib.dom.d.ts
            // typing of PerformanceEntry -- real, standard properties (web.dev/cls), just accessed
            // via a loose cast here rather than widening this file's whole PerformanceObserver typing.
            const shift = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
            if (!shift.hadRecentInput) cls += shift.value;
          }
        }).observe({ type: 'layout-shift', buffered: true });

        // A fixed settle window: this is a static SSG page (no client-side navigation/lazy content
        // loading after `load`), so LCP and CLS are both fully settled well before 1.5s in practice --
        // measured empirically while writing this test, not a guess.
        setTimeout(() => resolve({ lcpMs, cls }), 1500);
      }),
  );
}

const LCP_BUDGET_MS = 2000;
const CLS_BUDGET = 0.05;

// Measured across several local runs (task-W-8-report.md): '/' 's CLS varies roughly 0.015-0.045
// (font-swap reflow as Space Grotesk/Inter replace the fallback sans -- `font-display: swap`,
// tokens.css), always under budget but with a real margin, not a wide one. '/es/' stays under 0.01.
// Registered as a known risk (not a bug -- font-display: swap is the correct choice over `block`,
// which would trade this for invisible text instead), not silently tightened or loosened here.

for (const path of ['/', '/es/']) {
  test(`${path} at 380px: LCP < ${LCP_BUDGET_MS}ms and CLS < ${CLS_BUDGET}`, async ({ page }) => {
    const { lcpMs, cls } = await measureLcpAndCls(page, path);
    expect(lcpMs, `LCP was ${lcpMs.toFixed(0)}ms`).toBeLessThan(LCP_BUDGET_MS);
    expect(cls, `CLS was ${cls.toFixed(4)}`).toBeLessThan(CLS_BUDGET);
  });
}
