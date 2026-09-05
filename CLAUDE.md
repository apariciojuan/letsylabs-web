# CLAUDE.md — `letsy-web`

Contexto obligatorio para cualquier agente que trabaje en este repo. Ante conflicto con
`/Users/juanaparicio/projects/letsylabs/CLAUDE.md` (raíz del workspace) o `/docs`, ganan ellos.

## Qué es este repo

Sitio de marketing developer-first de letsylabs (Astro SSG + islas React solo donde hay
interacción). Fuentes de verdad de copy/diseño: `design_handoff_letsylabs_web/README.md` y
`design_handoff_letsylabs_web/letsylabs_web_spec_diseno.md` (**intocables**, solo lectura). Plan:
`docs/plans/web/00_plan_web.md` y `01_bootstrap.md` en la raíz del workspace.

## Reglas duras de este repo

1. **Honestidad primero.** `CLAIMS_MATRIX.md` es vinculante: nada en presente sin respaldo sellado.
   Cero logos de clientes falsos, cero testimonios, cero certificaciones no obtenidas. Futuros
   siempre con badge (`COMING SOON` / `PREVIEW` / `BETA` / `POST-GA`).
2. **Prohibido el morado IA.** Los tres acentos (`signal` verde, `tel` ámbar, `event` cian) codifican
   siempre lo mismo: voz/agente, telefonía, eventos/traza.
3. **Copy final del handoff, sin reescribir.** Únicos huecos permitidos: `{PRICE}`, `{ARTÍCULO}`,
   snippets de Developers, "logos de pilotos aquí" — siempre marcados, nunca inventados.
4. **Todo literal por i18n** (`src/i18n/{en,es}.json` + helper `t()` tipado). Nunca copy
   hardcodeado. `pnpm i18n:check` en rojo bloquea el merge.
5. **`prefers-reduced-motion` ⇒ todo estático.** Animaciones solo canvas/CSS transform.
6. **Cero scripts de terceros en cliente.** Fuentes self-hosted (`public/fonts/`, OFL 1.1). Ratchet
   `scripts/check_third_party.sh` sobre `dist/`.
7. **Nombres de proveedor:** prohibidos Deepgram/ElevenLabs/LiveKit en superficie pública;
   Asterisk/3CX/SIP permitidos como genéricos solo en `/telephony` (ver `CLAIMS_MATRIX.md`).
8. Un bug ⇒ su test de regresión. Causa raíz, no el síntoma.

## Cómo se trabaja aquí

- **Todo en contenedores.** Nada de `node`/`pnpm`/`astro` en el host. Comandos del día a día:
  `docker compose -f compose.dev.yml run --rm dev corepack pnpm <script>`. Ver `README.md`.
- `git config core.hooksPath scripts/hooks` (una vez por clon) activa el hook de pre-commit, que
  delega en `lefthook` dentro del contenedor.
- Contrato y tests primero; implementación después. `pnpm test`/`pnpm e2e`/`pnpm typecheck`/
  `pnpm lint`/`pnpm format:check`/`pnpm i18n:check` en verde antes de proponer merge.
- Commits pequeños, imperativo: `web: add i18n catalog and t() helper`.
