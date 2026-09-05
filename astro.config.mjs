// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  vite: {
    server: {
      // Vite's dev-server Host-header allowlist otherwise rejects requests from the `e2e`
      // container, which reaches this service by its Docker Compose DNS name (http://web:4321),
      // not localhost (compose.dev.yml, network letsy-dev).
      allowedHosts: ['web', 'localhost'],
    },
  },
});
