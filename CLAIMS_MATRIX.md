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

| Afirmación                                                                                                                                                                                             | Página | Respaldo (bloque del maestro/plan)                                                                                                                                                                                                                            | Estado                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| "Partial transcripts in under 300 ms. Spanish first, multilingual by design." (Voice/`stt.partial`)                                                                                                    | Home   | Ninguno sellado — ronda de medición R-11 del maestro no corrida todavía                                                                                                                                                                                       | `bloqueante`                         |
| "First audio per sentence, not per response." (Voice/`tts.first_audio`)                                                                                                                                | Home   | Ninguno sellado — R-11                                                                                                                                                                                                                                        | `bloqueante`                         |
| "Interrupt the agent with your voice. The runtime handles turns so your code doesn't." (Voice/`turn.barge_in`)                                                                                         | Home   | Ninguno sellado — R-11 (turn-taking/barge-in aún no implementado en el runtime)                                                                                                                                                                               | `bloqueante`                         |
| "Every segment measured, every conversation traced." (Voice/`latency.turn`)                                                                                                                            | Home   | Ninguno sellado — R-11                                                                                                                                                                                                                                        | `bloqueante`                         |
| "letsylabs ships these as infrastructure: automatic AI disclosure at call start, guaranteed transfer to a human, synthetic-audio marking and a certified, exportable audit log per call." (Compliance) | Home   | Ninguno sellado — bloque de `letsy-compliance` (doc 01/03) aún sin implementar                                                                                                                                                                                | `bloqueante`                         |
| "Run the entire platform on your servers with docker compose — including open-weight STT and TTS models…" (Self-host)                                                                                  | Home   | Ninguno sellado — bloque de despliegue self-host (doc 07) aún sin implementar                                                                                                                                                                                 | `bloqueante`                         |
| "The core contracts, VAD and open-weight model adapters are Apache 2.0." (Open source)                                                                                                                 | Home   | Maestro §2.10 (estrategia de apertura: `letsy-types`/`letsy-vad`/adaptadores open-weight abiertos desde el inicio) sella la LICENCIA, no la disponibilidad: los crates aún no están publicados                                                                | `bloqueante`                         |
| `<1s` voice-to-voice, `20ms` audio frames, `100%` events traced (Developers)                                                                                                                           | Home   | Cifras objetivo hasta la medición sellada de R-11 (regla 6 de este fichero) — badge `TARGET`/`OBJETIVO` visible junto a cada cifra en la página                                                                                                               | `target`                             |
| "Asterisk · 3CX · SIP carrier" / "Bring your SIP trunk or PBX — Asterisk, 3CX, your carrier" (Telephony)                                                                                               | Home   | Excepción explícita de la regla 4 de este fichero (telefonía genérica) — hoy también en la home, no solo en `/telephony` (aún sin construir, W-4); anotado como ampliación de la regla 4                                                                      | excepción registrada (no bloqueante) |
| "voxtral" (Self-host: "letsy-stt … Started 1.1s · voxtral, open weights"; Open source: "Open-weight model adapters — Voxtral and friends.")                                                            | Home   | Modelo de pesos abiertos citado por el propio handoff (`letsylabs_web_spec_diseno.md` §4.6/§4.7) — NO es un proveedor de la lista prohibida de la regla 3 (Deepgram/ElevenLabs/LiveKit); es el nombre del modelo abierto, igual trato que "Rust"/"Apache-2.0" | anotado (no bloqueante)              |

Filas añadidas en W-3 (homepage; primera ronda de afirmaciones reales, sustituye la fila vacía de
W-1). Las marcadas `bloqueante` no impiden compilar ni levantar el entorno de desarrollo — son la
lista que W-9 debe resolver (reescribir a futuro con badge, retirar, o esperar el bloque sellado
correspondiente) **antes de cualquier publicación pública real** del sitio; hasta entonces el sitio
es un entorno de desarrollo, no una web en producción (CLAUDE.md raíz §1.1: "en desarrollo,
pre-código, sin producción").
