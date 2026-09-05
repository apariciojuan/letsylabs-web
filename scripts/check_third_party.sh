#!/bin/sh
# Ratchet: zero third-party resources loaded by the built site (repo rule "cero scripts de terceros"
# -- docs/plans/web/00_plan_web.md rule 6, CLAUDE.md §7.2). Covers, with absolute (http(s)://) or
# protocol-relative (//) URLs: <script src>, <link href> (stylesheets, preconnect, prefetch, icons...
# except rel="alternate|canonical|license", which are references, not loads), <iframe>, <img>,
# <video>, <audio>, <source>, <object>, <embed>. Adversarial review W-1 H2 widened it from
# `<script src="http">` only.
# Meaningful once dist/ exists (after `pnpm build`); before that there is nothing to check.
set -eu

DIST_DIR="${1:-dist}"

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
  }
)

if [ -n "$MATCHES" ]; then
  echo "check_third_party: found third-party resource(s) in $DIST_DIR:" >&2
  echo "$MATCHES" >&2
  exit 1
fi

echo "check_third_party: OK -- no third-party scripts, links, frames or media found in $DIST_DIR."
