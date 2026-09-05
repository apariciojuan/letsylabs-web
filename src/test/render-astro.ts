/**
 * Shared test helper: renders an `.astro` component through `astro/container`
 * (`experimental_AstroContainer`) and parses the resulting HTML into its own `jsdom` `Document`, so
 * `@testing-library/dom` queries (or plain `querySelector`) can run against it.
 *
 * Deliberately does NOT rely on vitest's `jsdom` test environment (no `// @vitest-environment
 * jsdom` pragma needed in callers): Astro's container rendering breaks under it -- with jsdom's
 * globals (`document`, `window`) present, the compiled `.astro` factory no longer carries
 * `isAstroComponentFactory: true` by the time `container.renderToString()` inspects it, so Astro
 * falls back to its framework-island code path and throws `NoMatchingRenderer`. Verified with a
 * throwaway reproduction: identical render succeeds in the plain `node` environment and fails only
 * once the file environment is switched to `jsdom`. Creating our own single `JSDOM` instance here
 * (after the Astro render has already produced a plain string) avoids the conflict entirely.
 */
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { JSDOM } from 'jsdom';

// `experimental_AstroContainer` has a private constructor (only `AstroContainer.create()` may
// instantiate it), which `InstanceType<typeof AstroContainer>` cannot express in strict mode --
// derive the instance type from the factory method's return type instead.
type Container = Awaited<ReturnType<typeof AstroContainer.create>>;
type RenderComponent = Parameters<Container['renderToString']>[0];
type RenderOptions = Parameters<Container['renderToString']>[1];

// `AstroContainer.create()` spins up a full Vite SSR module runner -- expensive enough that
// creating one per render (i.e. per test) exhausted the dev container's 2GB memory limit once the
// component test suite grew past a handful of files (observed: `pnpm test` killed by the OOM killer
// partway through). One container is reused for every render across the whole worker process
// instead; Astro's own container docs describe this exact reuse pattern.
let containerPromise: Promise<Container> | null = null;

function getContainer(): Promise<Container> {
  if (!containerPromise) {
    containerPromise = AstroContainer.create();
  }
  return containerPromise;
}

export async function renderToBody(
  component: RenderComponent,
  options?: RenderOptions,
): Promise<HTMLElement> {
  const container = await getContainer();
  const html = await container.renderToString(component, options);
  const dom = new JSDOM(html);
  return dom.window.document.body;
}
