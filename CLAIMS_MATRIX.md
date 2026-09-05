# CLAIMS_MATRIX — letsy-web

Registro vinculante de toda afirmación en presente que la web publique sobre el producto. Ninguna
página puede afirmar algo en presente ("we do X", "available now", "100% uptime"...) sin una fila
aquí que lo respalde. Este fichero es el punto de referencia para el ratchet de honestidad
(`scripts/check_claims.mjs`, W-9) — todavía no implementado en W-1; esta tabla es el arranque.

Fuentes de las reglas: `docs/plans/web/00_plan_web.md` (reglas duras del repo, regla 1),
`web/design_handoff_letsylabs_web/README.md` (§Assets, reglas de honestidad) y
`web/design_handoff_letsylabs_web/letsylabs_web_spec_diseno.md` (§0).

## Reglas

1. **Nada en presente si no está sellado.** Toda afirmación que use un verbo en presente sobre algo
   que el producto hace o tiene ("streams audio", "transcribes in realtime", "100% events traced")
   necesita una fila en la tabla de abajo que apunte a un bloque **sellado** del documento maestro
   (`docs/letsylabs_decisiones_y_producto.md`) o de un plan (`docs/plans/**`). Si el respaldo no
   existe o el bloque no está sellado, la afirmación se reescribe como futuro/roadmap con badge
   (`COMING SOON` / `PREVIEW` / `BETA` / `POST-GA`) o se retira.
2. **La columna «Available» empieza vacía.** Hoy (W-1, bootstrap) no hay ninguna página publicada
   con contenido real, así que no hay ninguna afirmación "available" que registrar todavía. La
   primera fila real la añade quien escriba la primera página con copy (W-3 en adelante).
3. **Cero logos y cero nombres de proveedor de terceros que compitan o sean sustituibles.**
   Prohibido nombrar o mostrar el logo de: Deepgram, ElevenLabs, LiveKit (son proveedores/adaptadores
   internos — CLAUDE.md regla dura D-3: nombres de proveedores solo en adaptadores/configuración,
   nunca en superficie pública).
4. **Excepción explícita — telefonía genérica.** `Asterisk`, `3CX` y `SIP` SÍ pueden nombrarse en
   `/telephony` (y solo ahí) como términos genéricos del sector ("bring your own trunk — Asterisk,
   3CX, your carrier"), tal como indica
   `web/design_handoff_letsylabs_web/letsylabs_web_spec_diseno.md` §4.4 y §5 (`/telephony`). No son
   nombres de un proveedor que letsylabs revenda; son estándares/software de terceros que el
   _cliente_ ya usa.
5. **Cero logos de clientes falsos, cero testimonios inventados, cero certificaciones no obtenidas**
   (SOC2/ISO solo como roadmap con badge). Huecos honestos marcados explícitamente (p. ej. "logos de
   pilotos aquí", "☆ —" para estrellas de GitHub) en vez de rellenarlos con datos inventados.
6. **Cifras de rendimiento** (`<1s`, `20ms`, `100%`, latencias por tramo...) se tratan como objetivo
   ("target") hasta que exista una medición sellada (ronda R-11 del maestro) — con badge o texto
   "target" junto a la cifra.

## Tabla de afirmaciones

| Afirmación                                                                     | Página | Respaldo (bloque del maestro/plan) | Estado |
| ------------------------------------------------------------------------------ | ------ | ---------------------------------- | ------ |
| _(vacía — W-1 es solo bootstrap; ninguna página con copy real existe todavía)_ |        |                                    |        |
