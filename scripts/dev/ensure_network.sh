#!/bin/sh
# Creates the shared dev network once; every repo's compose references it as external (H6, see
# docs/specs/workspace_contenedores_dev.md §2 D-CONT-1).
set -eu
docker network inspect letsy-dev >/dev/null 2>&1 || docker network create letsy-dev
