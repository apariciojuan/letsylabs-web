# letsylabs — Especificación de la web pública (para Claude Design)

**Versión:** 0.1 · Basada en la "Guía de Branding, Mensaje y Contenidos Web" del proyecto, adaptada a la etapa 1 (voz) y al pilar de cumplimiento. Este documento contiene TODO lo necesario para diseñar y maquetar: marca, copy final, layout por sección, animaciones e interacciones, componentes y reglas.

---

## 0. Contexto para el diseñador

- **Qué es letsylabs:** infraestructura de voz en tiempo real para IA. Runtime auto-alojable (Rust): audio/telefonía → STT → *tu* agente/LLM → TTS, con traza auditable y cumplimiento legal europeo de serie. La inteligencia SIEMPRE la pone el cliente ("Bring your own intelligence").
- **Etapa de comunicación:** etapa 1 — **"Realtime Voice Infrastructure for AI"**. La visión mayor (vídeo, visión, avatares, edge/robótica) aparece como *Preview / Coming soon* en navegación y un bloque de visión, nunca como disponible.
- **Audiencia:** desarrolladores e integradores técnicos (España/UE primero). La web debe sentirse developer-first e infraestructura seria — referencia estética: Stripe, Vercel, Cloudflare, Supabase, Grafana. NUNCA: robots sonrientes, cerebros brillantes, degradados morados de IA, fotos de call centers.
- **Estado pre-GA:** hasta el lanzamiento (≈ marzo 2027) el CTA principal es **"Get early access"** (formulario waitlist); tras GA cambia a **"Start building"**. Diseñar ambos estados del botón.
- **Idiomas:** bilingüe EN/ES. EN por defecto (credibilidad dev); selector ES visible. Las páginas de cumplimiento son ES-first. El copy de este doc está en EN con alternativa ES donde importa para conversión.
- **Reglas de honestidad (no negociables):** cero logos de clientes falsos (placeholder marcado "logos de pilotos aquí"), cero testimonios inventados, cero certificaciones no obtenidas (SOC2/ISO se mencionan como roadmap), features futuras siempre con badge.

---

## 1. Marca

### 1.1 Nombre y logotipo
- Wordmark: **letsylabs** en minúsculas, tipografía display, tracking ligeramente negativo.
- Símbolo (dirección, no micrófonos/teléfonos/cámaras — limitarían el futuro): un **pulso de señal** abstracto — tres nodos conectados por una línea con un pulso desplazándose: `●───●───●`. Debe leerse a la vez como waveform, stream de datos y conexión. Versión animada del símbolo: el pulso recorre la línea en loop lento (3 s).
- Favicon: el nodo central con el pulso.

### 1.2 Paleta (dark-first; la web entera es oscura)
| Token | Hex | Uso |
|---|---|---|
| `bg` | `#07090D` | Fondo global (azul casi negro) |
| `surface` | `#0D1117` | Cards, code blocks, nav |
| `surface-2` | `#131A23` | Hover, elevación |
| `ink` | `#E8EDF2` | Texto principal |
| `muted` | `#8B96A5` | Texto secundario |
| `signal` | `#4AF2A1` | **Acento primario** (verde señal eléctrico): CTAs, pulsos, links, waveforms activas |
| `tel` | `#FFB454` | Acento telefonía (ámbar) |
| `event` | `#58C4F6` | Acento eventos/traza (cian) |
| `alert` | `#FF6B6B` | Errores, avisos |
| `line` | `rgba(255,255,255,0.08)` | Bordes, divisores |
- Regla: **prohibido el morado IA**. Los tres acentos codifican audio/telefonía/eventos de forma consistente en TODOS los diagramas.
- Gradientes: solo sutilísimos radiales del `signal` al 4-6 % de opacidad detrás de heros; nada de gradientes saturados.

### 1.3 Tipografía
- **Display / headlines:** Space Grotesk (600/500). Alternativa: Geist.
- **Body / UI:** Inter (400/500).
- **Mono (código, datos, métricas, endpoints):** JetBrains Mono. El contraste sans-grande + mono es parte de la identidad: `Build realtime voice AI.` seguido de `POST /v1/sessions`.
- Escala: hero 56-72px desktop / 34-40px móvil; h2 sección 36-40px; body 16-17px; mono 14-15px. Line-height generoso (1.15 headlines, 1.6 body).

### 1.4 Tono de copy
Directo. Frases cortas. Verbos. Cero humo. Ejemplo de tono correcto: *"Stream audio. Transcribe it. Generate speech. Route a call. Connect your AI."* Prohibido: "revolucionamos", "de última generación", "potenciado por IA".

### 1.5 Lenguaje visual
Todo el arte es **streams y señales**: waveforms, nodos, pulsos viajando por líneas, timelines de eventos, pipelines. Los diagramas son parte de la marca: fondo `surface`, nodos con borde `line`, pulsos animados en el acento correspondiente. Nada de ilustraciones 3D ni stock.

---

## 2. Sistema de animación e interacción (global)

Principios: sutil, técnico, con propósito (mostrar que las cosas *fluyen* en tiempo real). Todo respeta `prefers-reduced-motion` (fallback: estados estáticos).

1. **Pulsos de señal:** el motivo animado central. Puntos de luz (`signal`) que recorren las líneas de los diagramas a velocidad constante. Se usa en logo, hero, diagramas de pipeline y footer.
2. **Waveform viva (hero):** canvas de barras finas tipo osciloscopio reaccionando a un audio sintético en loop; al hacer scroll se "aplana" en una línea que se convierte en el pipeline del bloque 2 (transición scroll-linked).
3. **Código que se escribe:** los snippets del hero y Developers aparecen con efecto typing (rápido, 25-35 ms/carácter, solo primera vista, luego estático).
4. **Ticker de eventos:** una línea mono pequeña donde pasan eventos reales del sistema (`stt.final · 142ms`, `agent.first_token · 210ms`, `tts.first_audio · 96ms`) en loop — refuerza "traza" como identidad.
5. **Scroll reveal:** fade + translateY(12px), 350-400 ms ease-out, stagger 60 ms entre elementos de un grupo. Nada de parallax agresivo.
6. **Hover en cards:** borde pasa de `line` a `signal` al 40 %, elevación a `surface-2`, 150 ms.
7. **Diagrama interactivo del hero/bloque 2:** el usuario puede clicar la fuente (`Phone / Browser / Your app`) y el destino (`Your agent / OpenAI / Ollama / Any LLM`) y el pipeline re-dibuja el flujo con el pulso. Es la pieza estrella: comunica amplitud sin texto.
8. **Contadores de latencia:** números mono que cuentan hacia su valor al entrar en viewport (p. ej. "<1s voice-to-voice").

---

## 3. Sitemap (etapa 1)

```text
/
├─ Product
│   ├─ /voice            (disponible)
│   ├─ /telephony        (disponible en GA)
│   ├─ /compliance       (diferenciador — página estrella)
│   ├─ /self-host        (soberanía)
│   └─ [mega menú] Vision · Avatars · Edge & Robotics → badge "Coming soon" (sin página, tooltip)
├─ Developers
│   ├─ /docs (externo, app de docs)
│   ├─ /open-source      (crates públicos)
│   └─ /playground       (post-GA; pre-GA oculto)
├─ /pricing
├─ /company
└─ CTA header: [Docs] [Sign in] [Get early access ▸]
```

Header: fondo `bg` con blur al hacer scroll, borde inferior `line`. Mega menú Product en dos columnas: "Available" / "Platform vision" (badges). Footer: 4 columnas (Product, Developers, Company, Legal) + wordmark con pulso animado + selector de idioma + aviso "Made in the EU 🇪🇺" discreto.

---

## 4. Homepage — sección a sección

### 4.1 Hero
- Layout: dos columnas desktop (55/45), apiladas en móvil. Izquierda texto, derecha código sobre waveform viva.
- **Eyebrow (mono, `signal`):** `REALTIME VOICE INFRASTRUCTURE FOR AI`
- **H1:** `Give your AI a voice on the phone and on the web.`
  - ES: `Dale voz a tu IA — en el teléfono y en la web.`
- **Sub:** `Stream audio, transcribe in realtime, speak with low latency and route phone calls — connected to your own agent or LLM. Self-hosted or in our cloud. EU-compliant by design.`
  - ES: `Audio en streaming, transcripción en tiempo real, voz de baja latencia y llamadas telefónicas — conectado a tu propio agente o LLM. En tu infraestructura o en nuestro cloud. Cumplimiento europeo de serie.`
- **CTAs:** primario `Get early access` (relleno `signal`, texto `bg`); secundario `Read the docs` (ghost, borde `line`).
- **Código (derecha), con typing:**
```bash
curl -X POST https://api.letsylabs.com/v1/sessions \
  -H "Authorization: Bearer $LETSY_KEY" \
  -d '{ "connector": "my-agent", "language": "es" }'
```
```json
{ "session_id": "01JD…", "ws_url": "wss://…/audio" }
```
- Bajo el hero, el **ticker de eventos** (§2.4) a todo el ancho.

### 4.2 El pipeline (bloque identidad)
- Diagrama interactivo horizontal (vertical en móvil), pulso recorriéndolo:
```text
[ Phone ]  [ Browser ]  [ Your app ]
        ╲      │      ╱
      ── letsylabs runtime ──
      VAD · STT · turns · TTS · trace
              │
   [ Your agent ] [ Any LLM ] [ AymarAgents ]
```
- **H2:** `Bring your own intelligence.`
- **Texto:** `We handle realtime media — transport, transcription, turn-taking, interruptions, speech and the audit trail. You decide what thinks. Connect your agent over HTTP + SSE, or any OpenAI-compatible endpoint.`
- Selector interactivo de fuente/destino (§2.7).

### 4.3 Voice
- **H2:** `Speech infrastructure without the agent lock-in.`
- 4 cards (grid 2×2): `Realtime STT` (parciales en <300 ms), `Streaming TTS` (primer audio por frase), `Turn-taking & barge-in` (interrumpe al agente con la voz), `Latency tracing` (cada tramo medido, `latency.turn` por conversación).
- Micro-demo visual: transcript apareciendo palabra a palabra junto a su waveform.

### 4.4 Telephony
- **H2:** `Turn any phone call into a programmable stream.`
- **Texto:** `Bring your SIP trunk or PBX — Asterisk, 3CX, your carrier — and every call becomes a session your software controls. Inbound, outbound, transfers, DTMF.`
- Diagrama dos caminos (acento `tel`): `Your trunk → letsylabs` / `(soon) Managed numbers → letsylabs`. Badge "Managed telephony: coming soon".
- **Claim:** `Use your carrier. Or ours, later. Never locked in.`

### 4.5 Compliance (bloque diferenciador — el más importante de la home)
- Fondo ligeramente distinto (`surface`), borde superior `signal`.
- **Eyebrow:** `EU-COMPLIANT BY DESIGN`
- **H2:** `The law now requires it. We built it in.`
  - ES: `La ley ya lo exige. Nosotros lo traemos de serie.`
- **Texto:** `Spain's Ley 10/2025 and the EU AI Act require AI callers to identify themselves, offer a human handoff and keep records. letsylabs ships these as infrastructure: automatic AI disclosure at call start, guaranteed transfer to a human, synthetic-audio marking and a certified, exportable audit log per call.`
- 4 mini-features con icono: `AI disclosure` · `Human handoff` · `Audit trail` · `Retention controls`.
- CTA: `See how compliance works →` (a /compliance).
- **Nota de honestidad:** sin sellos ni escudos de certificación; el diseño transmite seriedad con la traza (timeline de eventos real), no con badges inventados.

### 4.6 Self-host & soberanía
- **H2:** `Your infrastructure. Your data. One command.`
- **Texto:** `Run the entire platform on your servers with docker compose — including open-weight STT and TTS models, so audio never leaves your infrastructure. The same stack we run in our cloud.`
- Visual: terminal estilizada con `docker compose up` y los servicios levantándose (animación de logs breve).
- Dos cards: `Self-hosted (licensed)` / `Managed cloud` con "misma API, mismo stack".

### 4.7 Open source
- **H2:** `Open where it matters.`
- **Texto:** `The core contracts, VAD and open-weight model adapters are Apache 2.0. Build with the same types we build on — in Rust today, Python soon.`
- Cards de crates (estilo repo: nombre mono + descripción + estrella): `letsy-types` · `letsy-vad` · `adapters (Voxtral, …)`. Badge `Python bindings: 2027`.

### 4.8 Developers
- **H2:** `From first stream to production.`
- Tabs de código (Rust / Python / curl) con el flujo mínimo: crear sesión → conectar WS → recibir `transcript.final` → el agente responde. (Snippets exactos los provee el equipo al maquetar; diseñar el componente de tabs.)
- Sub-bloque de métricas mono con contadores: `<1s voice-to-voice` · `20ms audio frames` · `100% events traced`.

### 4.9 Visión (plataforma futura) — pequeño, honesto
- **H2:** `Voice is the first sense.`
- Los pasos de la visión en una línea con pulso: `Voice → Realtime media → Vision → Avatars → Devices`, todo salvo Voice con badge `Coming`. Texto de una línea: `letsylabs is built as the interaction layer between intelligent software and the real world. We're shipping it one sense at a time.`

### 4.10 CTA final
- **H2:** `Build voice AI that holds up in production — and in an audit.`
- CTA `Get early access` + secundario `Talk to us` (mailto/form). Fondo con el radial `signal` al 5 %.

---

## 5. Páginas interiores (estructura + copy clave)

### /voice
Hero: `Realtime speech infrastructure for your applications.` Secciones: cómo funciona (pipeline con latencias por tramo anotadas), STT (parciales/finales, español primero, multilingüe), TTS (streaming por frases, Voice Registry: `Voices are platform resources — switch providers or bring cloned voices without changing code`, badge cloning "coming"), turn-taking y barge-in (diagrama de interrupción), traza (`Every conversation leaves a timeline you can query`), tabla de casos (AI agents, call automation, live transcription, assistants, accessibility), endpoints en mono (`/v1/sessions`, `wss://…/audio`), CTA docs.

### /telephony
Hero: `Programmable telephony built for humans and AI.` Secciones: inbound/outbound, trae tu trunk (logos genéricos: Asterisk, 3CX, SIP), transferencias y DTMF, handoff humano⇄IA (`Human ⟷ Call ⟷ AI` — no limitar a IA), grabaciones (con retención), roadmap gestionada (números, colas, webphone — badges), CTA.

### /compliance (página estrella — ES por defecto, EN disponible)
Hero: `Cumple la Ley 10/2025 sin construir nada.` Sub: `Aviso de IA, transferencia garantizada a humano, marcado de audio sintético y registro auditable por llamada — como parte de la infraestructura, no como proyecto aparte.` Secciones: (1) qué exige la ley en 4 puntos llanos con referencia al artículo (contenido legal lo redacta el equipo; diseñar el patrón "artículo → cómo lo resuelve letsylabs"); (2) timeline visual de una llamada conforme (evento a evento, acento `event`); (3) el registro auditable con captura del export; (4) retención y derechos (borrado, rectificación); (5) AI Act art. 50 para el resto de la UE; (6) FAQ legal breve; (7) CTA `Habla con nosotros`. Disclaimer visible: `letsylabs proporciona herramientas técnicas; el cumplimiento final depende de tu implementación. No es asesoramiento jurídico.`

### /self-host
Hero: `The sovereignty argument, proven.` Contenido: requisitos (un host, compose), qué incluye, ruta 100 % open-weight (diagrama: el audio nunca sale), diferencias self-host vs cloud (tabla), licencia comercial (sin precios: `Talk to us`), seguridad (cifrado, aislamiento por tenant, claves).

### /open-source
Hero: `Built in Rust. Open at the contracts.` Lista de crates con cards estilo repo, filosofía en 3 líneas (contratos abiertos, runtime cerrado, más apertura según crezca la comunidad — honesto), enlace GitHub, roadmap `letsy-py`.

### /pricing
Pre-GA: `Pricing lands with GA (March 2027). Early-access pilots get founding terms.` + form. Post-GA: 3 columnas — `Primitives` (€/min STT+TTS+orquestación), `Voice Agent` (€/min loop completo), `Self-hosted` (€/mes por despliegue, `Talk to us`) — precios como tokens `{PRICE}` a rellenar; nota `Bring your own carrier — telephony minutes are yours`. FAQ de facturación.

### /company
Corta y honesta: `We build the interaction layer between intelligent software and the real world — starting with voice, from Spain, for Europe.` Principios (3-4), el equipo (cuando quieran), contacto. Sin fotos stock.

---

## 6. Componentes (specs para el sistema de diseño)

- **Botones:** primario relleno `signal`/texto `bg` radius 8px; secundario ghost borde `line`; ambos con flecha `▸` que se desplaza 3px en hover.
- **Code block:** fondo `surface`, borde `line`, header con dots + label de lenguaje, botón copy, syntax theme propio (strings `signal`, keywords `event`, números `tel`).
- **Card:** `surface`, radius 12px, padding 24px, hover §2.6.
- **Badge:** mono 11px uppercase; variantes `AVAILABLE` (signal), `COMING SOON` (muted), `PREVIEW` (event), `BETA` (tel).
- **Diagrama de pipeline:** componente propio reutilizable (nodos + líneas + pulso), 3 tamaños; los acentos siempre codifican audio/tel/eventos.
- **Timeline de eventos:** filas mono `ts · type · latency` con línea vertical y puntos; usada en home (ticker), /voice y /compliance.
- **Nav, footer, form de early access** (email + "what are you building?" + país), **language switch**, **banner de cookies** minimalista.

## 7. Técnica, SEO y accesibilidad

- Performance: LCP < 2 s; animaciones canvas/CSS transform-only; lazy en diagramas bajo el fold; fuentes con `font-display: swap`.
- Responsive: breakpoints 1200/768/380; los diagramas horizontales rotan a verticales en móvil; el hero apila código bajo el texto.
- Accesibilidad: contraste AA sobre `bg` (verificar `muted`), focus visible en `signal`, `prefers-reduced-motion` en todo, diagramas con descripción textual.
- SEO: title home `letsylabs — Realtime voice infrastructure for AI, EU-compliant`; por página title+meta propios; OG images con el motivo de pulso; hreflang en/es; schema.org SoftwareApplication.

## 8. Assets a producir

Wordmark + símbolo (SVG, variante animada), motivo de pulso (Lottie o CSS/SVG), waveform hero (canvas), set de 12-16 iconos de línea (1.5px, estilo técnico: waveform, teléfono, transferencia, traza, candado, servidor, contenedor…), syntax theme, OG images (home + 4 páginas), favicon.

## 9. Fuera de alcance de la web (por ahora)

Playground interactivo (post-GA), blog/changelog (estructura sí, contenido después), páginas Vision/Avatars/Edge (solo badges), portal de docs (app aparte), testimonios y logos (huecos marcados hasta tener pilotos reales).
