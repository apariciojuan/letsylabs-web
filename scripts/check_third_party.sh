#!/bin/sh
# Ratchet: zero third-party resources loaded by the built site (repo rule "cero scripts de terceros"
# -- docs/plans/web/00_plan_web.md rule 6, CLAUDE.md §7.2). Covers, with absolute (http(s)://) or
# protocol-relative (//) URLs: <script src>, <link href> (stylesheets, preconnect, prefetch, icons...
# except rel="alternate|canonical|license", which are references, not loads), <iframe>, <img>,
# <video>, <audio>, <source>, <object>, <embed>, and (brief W-7) <form action>. Adversarial review
# W-1 H2 widened it from `<script src="http">` only; W-7 added <form action> for EarlyAccessForm's
# real POST target.
#
# Exactly ONE explicit exception (D-W7-6, spec docs/specs/web_formulario_seguridad.md): a
# <form action="..."> pointing at the EXACT value of $PUBLIC_WAITLIST_ENDPOINT (Formspree in
# production) -- passed via that env var, never guessed. Any OTHER external origin/action still
# fails, including a different path on the same host. Empty/unset -> no exception at all (the local
# battery's default build has no endpoint configured, D-W7-6, so EarlyAccessForm never renders a
# <form> and this exception never needs to fire).
#
# Meaningful once dist/ exists (after `pnpm build`); before that there is nothing to check.
set -eu

DIST_DIR="${1:-dist}"
ALLOWED_ACTION="${PUBLIC_WAITLIST_ENDPOINT:-}"

if [ ! -d "$DIST_DIR" ]; then
  echo "check_third_party: '$DIST_DIR' does not exist yet -- nothing to check."
  exit 0
fi

EXTERNAL='(https?:)?//'
MATCHES=$(
  {
    grep -rEo "<(script|iframe|img|video|audio|source|object|embed)[^>]+src=[\"']${EXTERNAL}[^\"']*" "$DIST_DIR" || true
    grep -rEo '<link[^>]*>' "$DIST_DIR" \
      | grep -E "href=[\"']${EXTERNAL}" \
      | grep -vE "rel=[\"'](alternate|canonical|license)[\"']" || true
    # Unlike the src= matches above, this one also captures the closing quote (`[\"']` at the end)
    # so the exception check below can require an EXACT value match, not just a prefix -- otherwise
    # "https://formspree.io/f/mock123" would also (wrongly) exempt
    # "https://formspree.io/f/mock123-evil.example.com" as a mere substring.
    grep -rEo "<form[^>]+action=[\"']${EXTERNAL}[^\"']*[\"']" "$DIST_DIR" || true
  }
)

if [ -n "$MATCHES" ] && [ -n "$ALLOWED_ACTION" ]; then
  MATCHES=$(
    printf '%s\n' "$MATCHES" \
      | grep -vF "action=\"${ALLOWED_ACTION}\"" \
      | grep -vF "action='${ALLOWED_ACTION}'" || true
  )
fi

if [ -n "$MATCHES" ]; then
  echo "check_third_party: found third-party resource(s) in $DIST_DIR:" >&2
  echo "$MATCHES" >&2
  exit 1
fi

echo "check_third_party: OK -- no third-party scripts, links, frames, media or form actions (beyond the one explicit exception, if any) found in $DIST_DIR."
