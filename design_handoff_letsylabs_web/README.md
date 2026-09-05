# Handoff: letsylabs — Web pública (etapa 1: Realtime Voice Infrastructure for AI)

## Overview
Sitio de marketing developer-first para **letsylabs**: infraestructura de voz en tiempo real para IA (runtime auto-alojable en Rust: audio/telefonía → STT → *tu* agente/LLM → TTS, con traza auditable y cumplimiento europeo de serie). Estética de referencia: Stripe, Vercel, Cloudflare, Supabase. Incluye homepage + 6 páginas interiores, nav y footer compartidos, y un sistema de animación de "pulsos de señal".

La spec original completa (marca, copy, reglas) está en `letsylabs_web_spec_diseno.md` dentro de este paquete — es la fuente de verdad para copy y reglas de honestidad.

## About the Design Files
Los ficheros de este paquete son **referencias de diseño en HTML** (prototipos que muestran el look y el comportamiento previstos), NO código de producción para copiar tal cual. La tarea es **recrear estos diseños en el entorno del proyecto destino** (Next.js/Astro/React, etc.) usando sus patrones y librerías; si no existe entorno aún, elige el framework más apropiado (recomendado: Astro o Next.js con SSG — es un sitio estático con islas interactivas) e implementa allí.

Notas sobre el formato de los prototipos:
- Cada `*.dc.html` contiene: una plantilla HTML (entre `<x-dc>` tags) con **todos los estilos inline**, y una clase JS (`class Component`) con la lógica de estado. Ignora el runtime (`support.js`, `sc-if`, `dc-import`, `{{ holes }}`) — es tooling del prototipo. Lo que importa: el markup, los valores de estilo exactos y la lógica descrita abajo.
- `<dc-import name="SiteNav">` / `<dc-import name="SiteFooter">` = montar el componente compartido correspondiente (`SiteNav.dc.html`, `SiteFooter.dc.html`).
- `site-fx.js` es la implementación de referencia de scroll-reveal, contadores y pulsos SVG (usable casi tal cual, o sustituible por IntersectionObserver en producción — en el prototipo se usó rect-checking por limitaciones del entorno de preview).

## Fidelity
**High-fidelity.** Colores, tipografía, espaciados, copy y microinteracciones son finales. Recrear pixel-perfect. El copy es final salvo los tokens marcados: `{PRICE}`, `{ARTÍCULO}` (los rellena el equipo legal/negocio), snippets de código de Developers (los provee el equipo), y huecos honestos ("logos de pilotos aquí", estrellas de GitHub "☆ —").

## Design Tokens

### Colores (dark-first — TODO el sitio es oscuro)
| Token | Valor | Uso |
|---|---|---|
| `bg` | `#07090D` | Fondo global |
| `surface` | `#0D1117` | Cards, code blocks, nav, terminal |
| `surface-2` | `#131A23` | Hover de cards, elevación, toggle activo |
| `ink` | `#E8EDF2` | Texto principal |
| `muted` | `#8B96A5` | Texto secundario |
| `signal` | `#4AF2A1` | **Acento primario** (verde): CTAs, pulsos, links, eventos agent/tts |
| `signal-hover` | `#6FF5B5` | Hover del CTA primario |
| `link-hover` | `#8DF7C5` | Hover de links de texto |
| `tel` | `#FFB454` | Acento telefonía (ámbar) |
| `event` | `#58C4F6` | Acento eventos/traza/STT (cian) |
| `alert` | `#FF6B6B` | Errores (solo dot rojo del terminal) |
| `line` | `rgba(255,255,255,0.08)` | Bordes, divisores |
| `line-strong` | `rgba(255,255,255,0.12)` a `0.14` | Bordes de inputs y botones ghost |

Reglas: **prohibido el morado IA**. Los 3 acentos codifican SIEMPRE lo mismo en todos los diagramas (verde=voz/agente, ámbar=telefonía, cian=eventos/traza/STT). Gradientes: solo radiales del `signal` al 4-6% detrás de heros: `radial-gradient(ellipse 800px 500px at X Y, rgba(74,242,161,0.05-0.06), transparent 70%)` (el hero de Telephony usa `rgba(255,180,84,0.05)`).

### Tipografía (Google Fonts)
- **Display/headlines:** Space Grotesk 600 (500 disponible). Letter-spacing negativo: -0.5px (wordmark) a -1.5px (H1 grandes).
- **Body/UI:** Inter 400/500.
- **Mono (código, eyebrows, badges, métricas, eventos):** JetBrains Mono 400/500.
- Escala: H1 hero `clamp(34-36px, 4.2-4.6vw, 58-66px)`, line-height 1.12; H2 sección `clamp(30px,3.4vw,40px)`, lh 1.15; H2 menores `clamp(24-26px,~3vw,30-34px)`; body 16-17px lh 1.6; secundario 13.5-15px; mono 11-15px; eyebrows mono 12px letter-spacing 2px; labels mono 10-11px letter-spacing 1-1.5px UPPERCASE.
- `text-wrap: pretty` en headlines y párrafos largos. `font-display: swap`.

### Espaciado y forma
- Contenedor: max-width **1180px**, padding lateral **32px**.
- Secciones: padding vertical 64-104px. Hero: 96px arriba.
- Header: alto **64px**, fixed, `rgba(7,9,13,0.78)` + `backdrop-filter: blur(14px)`, borde inferior `line`.
- Radius: botones/inputs/nodos de diagrama **8px**; cards/terminales/dropdowns **12px**; badges **4px**; contenedor "your infrastructure" **16px** (borde dashed).
- Cards: `surface`, borde `line`, padding 24-28px. Hover: borde → `rgba(74,242,161,0.4)` (o ámbar en Telephony), fondo → `surface-2`, transición **150ms**.
- Sombras: dropdown `0 20px 60px rgba(0,0,0,0.5)`; terminal/código hero `0 24px 80px rgba(0,0,0,0.45-0.5)`.

## Componentes compartidos

### SiteNav (`SiteNav.dc.html`)
Header fixed 64px. Izquierda: logo (símbolo pulso + wordmark "letsylabs" Space Grotesk 600 19px, tracking -0.5px) → linkea a home. Nav: "Product ▾" (mega menú), Developers, Pricing, Company (14px, `muted`, hover `ink`; página activa en `ink` — prop `active`). Derecha: Docs, Sign in (links muted), CTA primario "Get early access ▸".
- **Mega menú Product** (hover o click, div absoluto top 40px, 520px, 2 columnas): col 1 "AVAILABLE" (label mono 10px verde) con Voice/Telephony/Compliance/Self-host (título 14px 500 + descripción 12px muted, hover fondo `surface-2`); col 2 "PLATFORM VISION" (label muted) con Vision/Avatars/Edge & Robotics + badge "COMING SOON" cada uno (sin link, sin página).
- **Símbolo/logo**: 3 nodos verdes de 5px conectados por línea `rgba(255,255,255,0.25)` de 1px, con un punto blanco (glow verde `box-shadow: 0 0 6px #4AF2A1`) recorriéndola en loop de **3s** (keyframe `logoPulse`: translateX 0→30px, fade in/out en extremos).

### SiteFooter (`SiteFooter.dc.html`)
4 columnas de links (PRODUCT / DEVELOPERS / COMPANY / LEGAL, labels mono 10px) + columna de marca (logo animado, tagline "Realtime voice infrastructure for AI. EU-compliant by design.", "Made in the EU 🇪🇺" discreto). Barra inferior: © 2026 letsylabs · hello@letsylabs.com (mono 11px). En producción añadir el **selector de idioma EN/ES** aquí y en el header (el prototipo lo tiene en la homepage: pill con borde `line`, botón activo fondo `surface-2`).

### Botones
- **Primario:** fondo `signal`, texto `bg` (¡oscuro!), 500, padding 13px 22px, radius 8px, flecha `▸`. Hover: fondo `#6FF5B5`; la flecha se desplaza 3px.
- **Secundario/ghost:** transparente, borde `rgba(255,255,255,0.14)`, texto `ink`. Hover: borde `rgba(74,242,161,0.5)`.
- Estado del CTA global: pre-GA "Get early access"; post-GA "Start building" (en el prototipo: prop/tweak `gaLaunched`).

### Badges
Mono 10-11px, uppercase, letter-spacing 1px, radius 4px, borde 1px, padding ~2-4px 6-10px. Variantes: AVAILABLE (verde), COMING SOON (muted), PREVIEW (cian), BETA (ámbar), POST-GA (muted).

### Code block / Terminal
Fondo `surface`, borde `line`, radius 12px. Header: 3 dots (rojo/ámbar/verde al 70%), label de lenguaje mono 11px muted, botón copy (borde `line`, mono 10px, hover borde verde) que cambia a "copied ✓" 1.6s. Syntax theme propio: strings/valores `signal`, keywords/flags/claves `event`, números `tel`, comentarios `muted`. Mono 13px lh 1.7-1.75.

### Timeline de eventos
Filas mono `ts · type · detalle` con línea vertical izquierda (borde cian al 40%) y puntos de color según acento del evento. Usada en: ticker home, card de traza en Voice, timeline de llamada conforme en Compliance.

## Screens / Views

### 1. Homepage (`letsylabs Homepage.dc.html`)
1. **Hero** — 2 columnas 55/45 (flex-wrap; apila en móvil, código debajo del texto). Izq: eyebrow mono verde `REALTIME VOICE INFRASTRUCTURE FOR AI`; H1 "Give your AI a voice — on the phone and on the web." (ES: "Dale voz a tu IA — en el teléfono y en la web."); sub (ver spec); CTAs primario+ghost. Der: code block bash (curl POST /v1/sessions + respuesta JSON) con **efecto typing** (~26ms/2 chars, solo primera vista, cursor `▋` verde parpadeando, luego estático con syntax highlight) sobre una **waveform canvas** detrás (barras verdes finas 3px cada 7px, opacidad 0.35, animada por rAF con senos compuestos; estática si reduced-motion). El H1/sub cambian con el **toggle EN/ES** del header.
2. **Ticker de eventos** — banda full-width entre bordes `line`, fondo `surface`; línea mono 12px en marquee infinito (translateX -50%, 32s linear, contenido duplicado): `stt.partial · 118ms`, `agent.first_token · 210ms`, etc., cada uno con dot de su color de acento.
3. **Pipeline interactivo** (pieza estrella) — H2 centrado "Bring your own intelligence." + texto. SVG 800×400: 3 fuentes arriba (Phone/Browser/Your app), caja central "letsylabs runtime / VAD · STT · turns · TTS · trace" (borde verde 40%), 4 destinos abajo (Your agent/OpenAI/Ollama/Any LLM). **Clicable**: seleccionar fuente y destino re-dibuja la ruta; el camino activo pasa de `rgba(255,255,255,0.09)` a verde 65%, el nodo activo: fondo `#0F1B16`, borde verde, texto `ink`. Un **punto-pulso** (r=4, glow) recorre la ruta activa en loop de 2.6s (getPointAtLength sobre el path activo). Hint mono: "CLICK A SOURCE AND A DESTINATION TO REROUTE".
4. **Voice** — eyebrow verde, H2 "Speech infrastructure without the agent lock-in.", grid 2×2 de cards (Realtime STT / Streaming TTS / Turn-taking & barge-in / Latency tracing; cada una con su nombre de evento mono en su color de acento arriba). Debajo: card micro-demo con ecualizador CSS animado (8 barras verdes, keyframe scaleY 0.18→1, delays escalonados 90ms) + transcript ES apareciendo palabra a palabra en loop (380ms/palabra) con cursor.
5. **Telephony** — eyebrow ámbar, H2 "Turn any phone call into a programmable stream." Dos filas-diagrama: "Your trunk → letsylabs" con pulso ámbar viajando (keyframe left 0→100%, 2.4s) + badge "AVAILABLE AT GA"; "Managed numbers → letsylabs" al 55% opacidad + "COMING SOON". Claim mono ámbar: "Use your carrier. Or ours, later. Never locked in."
6. **Compliance** (bloque diferenciador) — fondo `surface`, **borde superior `rgba(74,242,161,0.5)`**. Eyebrow `EU-COMPLIANT BY DESIGN`, H2 "The law now requires it. We built it in." (ES: "La ley ya lo exige. Nosotros lo traemos de serie." — cambia con el toggle), texto Ley 10/2025 + AI Act. 4 mini-cards con iconos SVG de línea 1.5px (fondo `bg` para invertir contraste): AI disclosure / Human handoff / Audit trail / Retention controls. Link "See how compliance works →" a Compliance. **Sin sellos de certificación** — la seriedad la da la traza.
7. **Self-host** — 2 columnas: texto (H2 "Your infrastructure. Your data. One command.") + 2 mini-cards Self-hosted(licensed)/Managed cloud "Same API, same stack."; derecha terminal con `docker compose up -d` y servicios levantándose (líneas con reveal escalonado 200-800ms, checks verdes, cursor final).
8. **Open source** — H2 "Open where it matters.", 3 cards estilo repo (letsy-types/letsy-vad/letsy-adapters: nombre mono + descripción + chips Apache-2.0/Rust) + badge "PYTHON BINDINGS: 2027".
9. **Developers** — H2 "From first stream to production." Componente **tabs de código** (curl/Rust/Python; tab activa: texto `ink` + borde inferior 2px verde; Python lleva badge "2027"). Debajo: 3 **contadores** mono 34px verdes que cuentan hasta su valor al entrar en viewport (~900ms, ease-out cúbico): `<1s` voice-to-voice, `20ms` audio frames, `100%` events traced.
10. **Visión** — pequeño y honesto, centrado: H2 "Voice is the first sense.", línea `Voice → Realtime media → Vision → Avatars → Devices` (Voice en verde con dot, resto muted, badge COMING), 1 línea de texto.
11. **CTA final** — H2 "Build voice AI that holds up in production — and in an audit." + **form de early access** (email* + país + "What are you building?"; inputs fondo `surface`, borde 0.12, focus borde verde; submit cambia a "You're on the list ✓") + botón ghost "Talk to us" (mailto) + nota mono "GA lands March 2027 · early-access pilots get founding terms". Radial verde 5% de fondo.
12. **Banner de cookies** — fixed bottom-left, card `surface`: "We use one analytics cookie. That's it." + OK / No thanks. Se descarta con click (persistir en localStorage en producción).

### 2. Voice (`Voice.dc.html`)
Hero centrado (eyebrow VOICE verde, H1 "Realtime speech infrastructure for your applications."). Diagrama horizontal SVG con **latencias por tramo** (audio in → VAD 20ms frames → STT <300ms partial (cian) → your agent HTTP+SSE → TTS 96ms first audio → audio out) y pulso recorriéndolo (3.4s). 4 cards grandes: Realtime STT, Streaming TTS (con quote del Voice Registry + badge "VOICE CLONING: COMING"), Turn-taking & barge-in (mini-demo inline: "agent speaking" verde + barras ámbar + "caller barges in → tts.cancel · 61ms"), Latency tracing (mini-timeline con `latency.turn 448ms`). Tabla de casos de uso (5 filas: AI agents, Call automation, Live transcription, Assistants, Accessibility; grid 220px/1fr). Bloque de endpoints mono (`POST /v1/sessions`, `WS wss://…/audio`, `GET /v1/sessions/:id/trace`). CTA docs.

### 3. Telephony (`Telephony.dc.html`)
Hero centrado ámbar (H1 "Programmable telephony built for humans and AI."). Diagrama **Human ⟷ Call ⟷ AI** con dos pulsos ámbar viajando en direcciones opuestas (2.8s; el handoff no se limita a IA). 4 cards: Inbound & outbound, Bring your trunk (chips Asterisk/3CX/SIP — texto genérico, no logos reales), Transfers & DTMF, Recordings (retención). Card de roadmap con badges MANAGED NUMBERS/QUEUES/WEBPHONE · COMING SOON + claim ámbar. Link a Compliance.

### 4. Compliance (`Compliance.dc.html`) — página estrella, **ES por defecto**
Hero: "Cumple la Ley 10/2025 sin construir nada." + sub + CTA "Habla con nosotros" + nota "English version at GA". Secciones: (1) patrón **"LA LEY EXIGE · {ARTÍCULO}" → "LETSYLABS"** en 4 cards divididas por borde interior (obligación en `ink`, solución en `muted` con nombre de evento mono cian); (2) **timeline visual de llamada conforme** (call.answered → disclosure.played → stt.final "quiero hablar con una persona" → call.transfer.human ámbar → call.ended → trace.sealed; línea vertical cian, dots por acento, reveals escalonados); (3) **export auditable**: 2 columnas, texto + code block JSON (`GET …/trace?format=audit` con disclosure/handoff/synthetic_audio_marked/signature ed25519) y 3 checks (borrado/retención/AI Act art. 50); (4) FAQ legal (3 cards Q+A); (5) CTA final + **disclaimer obligatorio**: "letsylabs proporciona herramientas técnicas; el cumplimiento final depende de tu implementación. No es asesoramiento jurídico."

### 5. Self-host (`SelfHost.dc.html`)
Hero: "The sovereignty argument, proven." Diagrama **"YOUR INFRASTRUCTURE"** (contenedor borde dashed verde 16px radius con label flotante; dentro: audio in → letsy runtime → open-weight STT/TTS → your agent; caption "no external API calls · no audio egress · your keys, your tenants"). 2 columnas: terminal `docker compose up -d` (igual que home) + nota de requisitos; **tabla comparativa** Self-hosted vs Cloud (5 filas: API & stack, Audio egress None/EU region, Models, Updates, Pricing; header SELF-HOSTED en verde) + chips de seguridad (ENCRYPTION/TENANT ISOLATION/YOUR KEYS). Línea de licencia: "Commercial license, no public pricing yet — talk to us →".

### 6. Open source (`OpenSource.dc.html`)
Hero: "Built in Rust. Open at the contracts." 3 cards de crates estilo repo (con "☆ —" como placeholder honesto de estrellas), botón GitHub + badge "LETSY-PY: 2027". Bloque de filosofía con borde izquierdo verde 2px: "Open contracts, so you're never locked in. / Closed runtime, so we can build a business. / More opens up as the community grows."

### 7. Pricing (`Pricing.dc.html`) — dos estados (prop `gaLaunched`)
**Pre-GA (default):** H1 "Pricing lands with GA." + "March 2027. Early-access pilots get founding terms." + form waitlist (mismo componente que home). **Post-GA:** H1 "Pay for minutes, not promises.", 3 columnas: Primitives ({PRICE} €/min), Voice Agent (destacada: borde verde + tag flotante "MOST COMMON", {PRICE} €/min), Self-hosted (Talk to us). Nota carrier. Ambos estados: FAQ de facturación (3 cards: minutos de telefonía aparte, founding terms, LLM no incluido — "we never mark up model tokens").

### 8. Company (`Company.dc.html`)
H1 statement grande centrado: "We build the interaction layer between intelligent software and the real world — starting with voice, from Spain, for Europe." 4 cards de principios numeradas (01 Bring your own intelligence / 02 Compliance is infrastructure / 03 Sovereignty is real / 04 No smoke). Línea de contacto: "The team, when they're ready. Until then: hello@letsylabs.com". **Sin fotos stock.**

## Interactions & Behavior
- **Scroll reveal:** elementos con `data-reveal`: opacity 0 + translateY(12px) → visible al cruzar el 92% del viewport; transición 380ms ease-out; stagger por `data-delay` (60ms entre hermanos, hasta 800ms en líneas de terminal). En producción: IntersectionObserver threshold ~0.12, revelar una sola vez.
- **Contadores** (`data-counter` + `data-target`/`data-prefix`/`data-suffix`): cuentan 0→target en 900ms con ease-out cúbico al entrar en viewport (una vez).
- **Pulsos SVG:** punto r=4 con `filter: drop-shadow(0 0 6px <acento>)` avanzando por `getPointAtLength` en rAF; velocidad por diagrama (2.6-3.4s/loop). Versión CSS para líneas rectas: keyframes `telpulse`/`telpulseback`.
- **Typing del hero:** ~26ms por 2 caracteres, una sola vez, luego versión estática con highlight.
- **Marquee ticker:** contenido duplicado, translateX(-50%) en 32s linear infinite.
- **Hover cards:** borde `line` → acento al 40%, fondo → `surface-2`, 150ms.
- **Mega menú:** abre por hover (mouseenter/leave en el contenedor) y por click (toggle).
- **Toggle EN/ES:** cambia H1/sub del hero y H2 de compliance en la home (en producción: i18n completo con hreflang en/es, EN por defecto, /compliance ES-first).
- **prefers-reduced-motion:** TODO estático — sin typing (código ya escrito), sin pulsos (dots ocultos), sin reveals (todo visible), sin marquee/ecualizador; media query global `animation:none; transition:none` + checks en JS.
- **Forms:** email required (validación nativa); submit → estado "You're on the list ✓" (en producción: POST al backend de waitlist).

## State Management
- `lang: 'en'|'es'` (home; producción: routing i18n).
- `gaLaunched: boolean` — flag global de lanzamiento: cambia CTA "Get early access"→"Start building" y el layout entero de Pricing.
- `src: 0-2`, `dst: 0-3` — pipeline interactivo de la home.
- `tab: 'curl'|'rust'|'py'` — tabs de Developers.
- `menuOpen`, `sent` (waitlist), `copied` (botón copy), `cookieDismissed` (persistir).
- Sin data fetching; todo estático salvo el submit de waitlist.

## Assets
- **Sin assets binarios**: logo/símbolo, iconos y diagramas están construidos con HTML/CSS/SVG inline (iconos de línea 1.5px, formas simples). Fuentes desde Google Fonts (Space Grotesk, Inter, JetBrains Mono).
- Pendientes de producir (fuera de este paquete): wordmark+símbolo SVG definitivo, favicon (nodo central con pulso), OG images con el motivo de pulso, set completo de 12-16 iconos de línea.
- **Reglas de honestidad (no negociables):** cero logos de clientes falsos, cero testimonios inventados, cero certificaciones no obtenidas (SOC2/ISO solo como roadmap), features futuras siempre con badge COMING.

## Técnica / SEO / Accesibilidad (objetivos de producción)
- LCP < 2s; animaciones solo canvas/CSS transform; lazy en diagramas bajo el fold.
- Breakpoints 1200/768/380; diagramas horizontales rotan a verticales en móvil; hit targets móviles ≥44px.
- Contraste AA sobre `bg` (verificar `muted` #8B96A5); focus visible en `signal`; descripciones textuales (`role="img"` + `aria-label`) en todos los diagramas SVG.
- Title home: `letsylabs — Realtime voice infrastructure for AI, EU-compliant`; hreflang en/es; schema.org SoftwareApplication.

## Files
| Fichero | Qué es |
|---|---|
| `letsylabs_web_spec_diseno.md` | Spec original completa (fuente de verdad de copy y reglas) |
| `letsylabs Homepage.dc.html` | Homepage (12 bloques) |
| `Voice.dc.html` | /voice |
| `Telephony.dc.html` | /telephony |
| `Compliance.dc.html` | /compliance (ES) |
| `SelfHost.dc.html` | /self-host |
| `OpenSource.dc.html` | /open-source (+ rol de Developers) |
| `Pricing.dc.html` | /pricing (2 estados) |
| `Company.dc.html` | /company |
| `SiteNav.dc.html` | Header compartido + mega menú |
| `SiteFooter.dc.html` | Footer compartido |
| `site-fx.js` | Referencia: scroll-reveal, contadores, pulsos SVG |

Fuera de alcance por ahora (spec §9): playground interactivo (post-GA), blog/changelog, páginas Vision/Avatars/Edge (solo badges), portal de docs, testimonios/logos.
