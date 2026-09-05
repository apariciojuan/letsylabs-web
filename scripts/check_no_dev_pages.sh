#!/bin/sh
# Ratchet: the dev-only QA harness under src/pages/dev/ (brief W-2 entregable 7: "páginas de
# demostración solo en dev... no se genera en build") must never end up in the production build.
# astro.config.mjs's `stripDevPages` integration deletes dist/dev/ in the astro:build:done hook;
# this is the check that the deletion actually happened (or that dev/ was never emitted at all).
#
# Meaningful once dist/ exists (after `pnpm build`); before that there is nothing to check, same
# convention as scripts/check_third_party.sh.
set -eu

DIST_DIR="${1:-dist}"

if [ ! -d "$DIST_DIR" ]; then
  echo "check_no_dev_pages: '$DIST_DIR' does not exist yet -- nothing to check."
  exit 0
fi

if [ -d "$DIST_DIR/dev" ]; then
  echo "check_no_dev_pages: found '$DIST_DIR/dev' -- the dev-only QA harness must not ship in the production build." >&2
  exit 1
fi

echo "check_no_dev_pages: OK -- no dev/ directory found in $DIST_DIR."
