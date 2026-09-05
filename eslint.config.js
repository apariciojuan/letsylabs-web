// @ts-check
import eslintPluginAstro from 'eslint-plugin-astro';
import tseslint from 'typescript-eslint';

/** @type {Record<string, 'readonly' | 'writable' | 'off'>} */
const nodeGlobals = {
  process: 'readonly',
  console: 'readonly',
  fetch: 'readonly',
  URL: 'readonly',
};

/** @type {Record<string, 'readonly' | 'writable' | 'off'>} */
const browserGlobals = {
  window: 'readonly',
  document: 'readonly',
  navigator: 'readonly',
  fetch: 'readonly',
  console: 'readonly',
  localStorage: 'readonly',
  IntersectionObserver: 'readonly',
  requestAnimationFrame: 'readonly',
  HTMLElement: 'readonly',
};

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      '.astro/**',
      'node_modules/**',
      'public/**',
      '.pnpm-store/**',
      // Design references only (README: "referencias de diseño... NO código de producción") — read,
      // never linted or type-checked.
      'design_handoff_letsylabs_web/**',
    ],
  },
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs['flat/recommended'],
  {
    // Node-only files: config, scripts, tests run under Vitest's Node environment.
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: { globals: nodeGlobals },
  },
  {
    // Browser-facing source: components and islands run in the page.
    files: ['**/*.{ts,tsx}', '**/*.astro'],
    languageOptions: { globals: { ...nodeGlobals, ...browserGlobals } },
  },
);
