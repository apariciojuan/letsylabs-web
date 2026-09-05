#!/bin/sh
# Ratchet: zero third-party <script src="http(s)://..."> tags in the built output (repo rule "cero
# scripts de terceros" -- docs/plans/web/00_plan_web.md rule 6, design_handoff honesty rules).
# Meaningful once dist/ exists (after `pnpm build`); before that there is nothing to check, so this
# exits 0 rather than failing a build that hasn't happened yet.
set -eu

DIST_DIR="${1:-dist}"

if [ ! -d "$DIST_DIR" ]; then
  echo "check_third_party: '$DIST_DIR' does not exist yet -- nothing to check."
  exit 0
fi

MATCHES=$(grep -rE '<script[^>]+src="https?://' "$DIST_DIR" || true)

if [ -n "$MATCHES" ]; then
  echo "check_third_party: found third-party <script src> tag(s) in $DIST_DIR:" >&2
  echo "$MATCHES" >&2
  exit 1
fi

echo "check_third_party: OK -- no third-party <script src> tags found in $DIST_DIR."
