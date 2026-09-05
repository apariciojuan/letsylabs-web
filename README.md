# letsy-web

Sitio de marketing developer-first de **letsylabs** (Astro SSG + islas React solo donde hay
interacción). EN por defecto (`/`), ES completo (`/es/*`). Todo se ejecuta en contenedores — nada
se instala en el host salvo Docker y git (`docs/specs/workspace_contenedores_dev.md`).

Diseño y copy: `design_handoff_letsylabs_web/` (intocable, solo lectura). Reglas del repo:
`CLAUDE.md`. Matriz de honestidad: `CLAIMS_MATRIX.md`.

## Arranque

Requisito: Docker Desktop arrancado. Ningún paso siguiente instala nada en tu máquina.

```sh
# una vez: crea la red compartida entre repos del workspace (si no existe)
sh scripts/dev/ensure_network.sh

# instala dependencias (frozen lockfile)
docker compose -f compose.dev.yml run --rm dev corepack pnpm install --frozen-lockfile

# levanta el dev server con HMR en http://localhost:4321
docker compose -f compose.dev.yml up web
```

Edita cualquier fichero bajo `src/` con el servicio `web` levantado y el navegador recarga solo
(bind mount + `astro dev --host 0.0.0.0`).

## Comandos

Todos se ejecutan con `docker compose -f compose.dev.yml run --rm dev corepack pnpm <script>`:

| Script               | Qué hace                                                                        |
| -------------------- | ------------------------------------------------------------------------------- |
| `dev`                | Servidor de desarrollo con HMR (`astro dev --host 0.0.0.0 --port 4321`)         |
| `build`              | Build de producción a `dist/` (`astro build`)                                   |
| `preview`            | Sirve `dist/` para revisar el build                                             |
| `typecheck`          | `astro check` (TypeScript + diagnósticos de Astro)                              |
| `lint`               | ESLint (flat config + `eslint-plugin-astro` + `typescript-eslint`)              |
| `format:check`       | Prettier en modo comprobación (`prettier-plugin-astro` incluido)                |
| `test`               | Vitest — tests unitarios (`src/**/*.test.*`, `scripts/**/*.test.*`)             |
| `e2e`                | Playwright — ver más abajo, necesita el perfil `e2e`                            |
| `i18n:check`         | Paridad de claves/arrays entre `src/i18n/en.json` y `es.json`                   |
| `placeholders:check` | Ningún `{TOKEN}` (p. ej. `{PRICE}`) suelto en `dist/` fuera de un `Placeholder` |
| `headers:check`      | `dist/_headers` completo y ningún `<script>` inline en `dist/` (brief W-7)      |

Ratchets adicionales (no son scripts de `package.json`, se invocan directos):

```sh
scripts/check_compose.sh .compose.rendered.json   # exige mem_limit/memswap_limit/healthcheck
scripts/check_third_party.sh dist                 # cero <script src="http(s)://..."> en el build
```

### End-to-end (Playwright)

El servicio `e2e` usa la imagen oficial de Playwright (mismo tag que `@playwright/test` en
`package.json`) y necesita que `web` esté levantado y sano:

```sh
docker compose -f compose.dev.yml up -d web
docker compose -f compose.dev.yml --profile e2e run --rm e2e corepack pnpm e2e
docker compose -f compose.dev.yml down
```

### Variables de entorno de build

Ambas leídas por `import.meta.env.*` (Vite/Astro exponen todo lo prefijado `PUBLIC_`), documentadas
en `.env.example`:

| Variable                   | Qué hace                                                                                                                                                                                                                                                                                                                                                                                            |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PUBLIC_GA_LAUNCHED`       | `true`/`false` (default `false`). Cambia el CTA global ("Get early access" → "Start building") y el layout de `/pricing`.                                                                                                                                                                                                                                                                           |
| `PUBLIC_WAITLIST_ENDPOINT` | Destino del formulario de acceso anticipado (`EarlyAccessForm`, brief W-7). Vacío/no definido (default) ⇒ **fail-closed**: no se renderiza `<form>`, solo el CTA `mailto:`. En producción, una URL `https://` absoluta (Formspree) — `astro build` **falla** si no lo es. El servicio `web` de `compose.dev.yml` la fija a `/__dev/waitlist` (mock de desarrollo, `scripts/dev/waitlist-mock.mjs`). |

### Cabeceras de seguridad

Brief W-7 (D-W7-4): `astro build` escribe `dist/_headers` (convención de Netlify/Cloudflare Pages,
`scripts/security-headers.mjs`) con CSP estricta (`script-src 'self'`, cero scripts inline), HSTS,
`X-Frame-Options: DENY`, `Referrer-Policy` y `Permissions-Policy`. Si el hosting final NO es
Netlify/Cloudflare Pages, aplica la política equivalente en la config del servidor -- por ejemplo,
nginx:

```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' <origen del endpoint, si lo hay>; form-action 'self' <origen del endpoint, si lo hay>; frame-ancestors 'none'; base-uri 'self'; object-src 'none'; upgrade-insecure-requests" always;
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), interest-cohort=()" always;
```

`<origen del endpoint, si lo hay>` = el origen (esquema+host) de `PUBLIC_WAITLIST_ENDPOINT` en ese
build; omítelo por completo si la variable está vacía (fail-closed, D-W7-1).

### Métricas y límites

```sh
docker stats --no-stream   # comprobar mem_limit (2g por servicio) durante la batería
```

## Hook de pre-commit

Este repo usa `lefthook` **dentro del contenedor**, nunca en el host. Instálalo una vez por clon:

```sh
git config core.hooksPath scripts/hooks
```

`scripts/hooks/pre-commit` (versionado) hace: si todo lo staged es `*.md`, pasa sin tocar Docker; si
no, exige Docker arrancado, renderiza `compose.dev.yml` a `.compose.rendered.json` (para el ratchet
de límites, que no puede llamar a `docker` desde dentro del contenedor) y ejecuta
`lefthook run pre-commit` (lint + format:check + typecheck + i18n:check + ratchet de compose) sobre
lo tocado. **No se ejecuta `git config core.hooksPath` automáticamente** — cada clon lo activa a
mano con el comando de arriba.

## Añadir un idioma

Hoy solo `en`/`es` (`astro.config.mjs` → `i18n.locales`). Para añadir uno:

1. Añade el código a `i18n.locales` en `astro.config.mjs` (y decide si va con o sin prefijo de ruta
   en `i18n.routing`).
2. Crea `src/i18n/<código>.json` con exactamente las mismas claves y forma de arrays que
   `src/i18n/en.json` — `pnpm i18n:check` falla si no coinciden.
3. Añade `<código>` a la lista `locales` importada de `src/i18n/index.ts` (se usa para generar los
   `hreflang` y el selector de idioma).
4. Crea las páginas bajo `src/pages/<código>/` (o en la raíz si es el nuevo `defaultLocale`).

## Estructura

```text
src/
  i18n/          catálogo (en.json, es.json), helper t(), utilidades de rutas
  layouts/       BaseLayout.astro (hreflang, selector de idioma, tokens.css)
  pages/         / (en), /es/ (es)
  styles/        tokens.css (colores, tipografía, reset) + fuentes self-hosted
public/fonts/    Space Grotesk 500/600, Inter 400/500, JetBrains Mono 400/500 (TTF, OFL 1.1)
e2e/             specs de Playwright (perfil `e2e` del compose)
scripts/         ratchets (i18n, compose, terceros) + hooks de git
```

## Estado

Bootstrap (W-1): scaffold, i18n, tokens/tipografía, calidad (ESLint/Prettier/Vitest/Playwright),
contenedores y `CLAIMS_MATRIX.md` inicial. Sin páginas ni copy del handoff todavía — solo un H1 de
prueba en `/` y `/es/` para probar el catálogo i18n end-to-end.

## Recuperación: «Another astro dev server is already running»

Si el contenedor `web` murió sin `astro dev stop` (un `down` a media sesión, OOM, reinicio de Docker),
Astro deja `.astro/dev.json` en el bind mount y se niega a arrancar. El servicio `web` borra ese lock al
arrancar (`compose.dev.yml`), así que basta con `docker compose -f compose.dev.yml up -d web`. Si lanzas
`astro dev` a mano dentro de `dev`, borra antes `.astro/dev.json`.
