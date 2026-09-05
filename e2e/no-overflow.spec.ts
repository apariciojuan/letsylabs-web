import { expect, test } from '@playwright/test';

// Brief W-1 entregable 4 / RWD breakpoints from the handoff README (§Técnica): 380 (mobile),
// 768 (tablet), 1200 (desktop). No page should force horizontal scroll at any of them.
const breakpoints = [380, 768, 1200];
// '/dev/components' added in W-2: it's the only page mounting SiteNav/SiteFooter/PipelineDiagram
// today, so it is where a regression in their responsive layout would actually show up.
const pages = ['/', '/es/', '/dev/components'];

for (const width of breakpoints) {
  for (const path of pages) {
    test(`no horizontal overflow at ${width}px on ${path}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      const overflows = await page.evaluate(() => {
        const root = document.documentElement;
        return root.scrollWidth > root.clientWidth;
      });
      expect(overflows).toBe(false);
    });
  }
}
