/**
 * Literal hero code snippet (brief W-3, W3-1a / "letsylabs Homepage.dc.html" lines 526-530): the
 * plain-text source used by the typing effect (src/scripts/hero-typing.ts), kept char-for-char
 * identical to the syntax-highlighted markup rendered by Hero.astro. Not i18n -- it's a literal API
 * example, the same in both locales (decision: code snippets are not translated).
 */
export const HERO_CODE = `curl -X POST https://api.letsylabs.com/v1/sessions \\
  -H "Authorization: Bearer $LETSY_KEY" \\
  -d '{ "connector": "my-agent", "language": "es" }'

{ "session_id": "01JD…", "ws_url": "wss://…/audio" }`;
