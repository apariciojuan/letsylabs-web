#!/bin/sh
# Ratchet (CU-CONT-9): every service in the rendered compose file must declare mem_limit,
# memswap_limit and a healthcheck (docs/specs/workspace_contenedores_dev.md §2 D-CONT-5).
#
# Input: the compose file already rendered to JSON, e.g.
#   docker compose -f compose.dev.yml config --format json > .compose.rendered.json
#   scripts/check_compose.sh .compose.rendered.json
#
# This never shells out to docker itself and never runs inside the dev container (which has no
# Docker CLI/socket, spec §2 H4) — it only reads the JSON file it is given. The git pre-commit hook
# (scripts/hooks/pre-commit) renders that JSON on the host before calling lefthook, which calls this
# script inside the container against the bind-mounted file.
set -eu

INPUT="${1:-.compose.rendered.json}"

if [ ! -f "$INPUT" ]; then
  echo "check_compose: rendered compose file not found: $INPUT" >&2
  exit 1
fi

FAILED=0
SERVICES=$(jq -r '.services | keys[]' "$INPUT")

for svc in $SERVICES; do
  mem_limit=$(jq -r --arg s "$svc" '.services[$s].mem_limit // empty' "$INPUT")
  memswap_limit=$(jq -r --arg s "$svc" '.services[$s].memswap_limit // empty' "$INPUT")
  healthcheck=$(jq -r --arg s "$svc" '.services[$s].healthcheck // empty' "$INPUT")

  if [ -z "$mem_limit" ]; then
    echo "check_compose: service '$svc' has no mem_limit" >&2
    FAILED=1
  fi
  if [ -z "$memswap_limit" ]; then
    echo "check_compose: service '$svc' has no memswap_limit" >&2
    FAILED=1
  fi
  if [ -z "$healthcheck" ]; then
    echo "check_compose: service '$svc' has no healthcheck" >&2
    FAILED=1
  fi
done

if [ "$FAILED" -ne 0 ]; then
  exit 1
fi

echo "check_compose: OK -- every service in $INPUT has mem_limit, memswap_limit and healthcheck."
