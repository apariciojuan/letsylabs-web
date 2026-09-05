/// <reference types="vitest/config" />
// `getViteConfig` (not plain `defineConfig` from 'vitest/config') merges Astro's own Vite plugins
// into the test runner -- required so `*.test.ts` files can `import Foo from '../Foo.astro'` and
// render it through `astro/container` (brief W-2 entregable 2: "Vitest + @testing-library/dom sobre
// el HTML renderizado con el Container API de Astro"). Astro's documented pattern for this
// (https://docs.astro.build/en/guides/testing/#container-api - vitest integration).
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    // The dev/CI container has a 2GB mem_limit (compose.dev.yml). Vitest's default file-parallelism
    // spins up multiple worker threads, each importing Astro's Vite SSR pipeline independently --
    // together with per-test `astro/container` renders this exhausted the limit and the runner was
    // OOM-killed partway through. Running files sequentially in one worker trades some wall-clock
    // time for staying inside the memory budget; see also the container-reuse fix in
    // src/test/render-astro.ts, which was the larger part of the fix.
    fileParallelism: false,
    environment: 'node',
    // Individual test files opt into `jsdom` with a `// @vitest-environment jsdom` pragma when they
    // need to render into `document` (component tests, DOM-manipulating script modules) or mock
    // browser globals (`matchMedia`, `IntersectionObserver`...). Plain logic/data tests stay on the
    // faster `node` environment.
    // Unit tests only: Playwright's e2e specs live under e2e/ and run via `pnpm e2e`, not vitest.
    include: ['src/**/*.test.{ts,tsx,js,mjs}', 'scripts/**/*.test.{ts,mjs}'],
  },
});
