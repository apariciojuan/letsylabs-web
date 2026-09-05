#!/bin/sh
# Ratchet (CU-CONT-9): every service in the rendered compose file must declare a REAL memory limit
# (mem_limit and memswap_limit as integers > 0 -- `docker compose config --format json` renders them
# in bytes) and an ACTIVE healthcheck (a non-empty `test`, and `disable` not true)
# (docs/specs/workspace_contenedores_dev.md §2 D-CONT-5; adversarial review W-1 H1: "present" was not
# enough -- `mem_limit: 0` and `healthcheck: {disable: true}` used to pass).
#
# Input: the compose file already rendered to JSON, e.g.
#   docker compose -f compose.dev.yml config --format json > .compose.rendered.json
#   scripts/check_compose.sh .compose.rendered.json
#
# Never shells out to docker (the dev container has no Docker CLI/socket, spec §2 H4): the git
# pre-commit hook renders the JSON on the host and lefthook runs this inside the container.
set -eu

INPUT="${1:-.compose.rendered.json}"

if [ ! -f "$INPUT" ]; then
  echo "check_compose: rendered compose file not found: $INPUT" >&2
  exit 1
fi

FAILED=0
fail() {
  echo "check_compose: $1" >&2
  FAILED=1
}

is_positive_int() {
  case "$1" in
    '' | *[!0-9]*) return 1 ;;
    *) [ "$1" -gt 0 ] ;;
  esac
}

SERVICES=$(jq -r '.services | keys[]' "$INPUT")

for svc in $SERVICES; do
  mem_limit=$(jq -r --arg s "$svc" '.services[$s].mem_limit // empty' "$INPUT")
  memswap_limit=$(jq -r --arg s "$svc" '.services[$s].memswap_limit // empty' "$INPUT")
  hc_disable=$(jq -r --arg s "$svc" '.services[$s].healthcheck.disable // false' "$INPUT")
  hc_test=$(jq -r --arg s "$svc" '.services[$s].healthcheck.test // empty | if type == "array" then join(" ") else . end' "$INPUT")

  if ! is_positive_int "$mem_limit"; then
    fail "service '$svc' has no mem_limit (or it is not an integer > 0: '${mem_limit}')"
  fi
  if ! is_positive_int "$memswap_limit"; then
    fail "service '$svc' has no memswap_limit (or it is not an integer > 0: '${memswap_limit}')"
  fi
  if [ -z "$hc_test" ] || [ "$hc_disable" = "true" ]; then
    fail "service '$svc' has no active healthcheck (missing test, or disable: true)"
  fi
done

if [ "$FAILED" -ne 0 ]; then
  exit 1
fi

echo "check_compose: OK -- every service in $INPUT has a positive mem_limit/memswap_limit and an active healthcheck."
