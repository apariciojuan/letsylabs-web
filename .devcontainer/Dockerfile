# syntax=docker/dockerfile:1
# Development image for letsy-web. Node 24 LTS (docs/specs/workspace_contenedores_dev.md §2
# D-CONT-8, sellado 2026-09-05). Same image is meant to serve CI once WS-D1 closes.
FROM node:24-bookworm-slim

ARG UID=1000
ARG GID=1000
ARG TARGETARCH
ARG LEFTHOOK_VERSION=2.1.12
ARG LEFTHOOK_SHA256_ARM64=9c130d98d2d57286698200b83998db9c025f350541aa6368315ff43b7a6440ac
ARG LEFTHOOK_SHA256_AMD64=22ff1ad48d1a0f4dca8d6b7e920056c6a9015f9204e5b693858ed9c2db759a16

RUN apt-get update && apt-get install -y --no-install-recommends \
        git ca-certificates curl jq \
    && rm -rf /var/lib/apt/lists/*

# Prebuilt lefthook binary (release asset), checksum verified against the value recorded in
# task-W-1-progress.md — never trust an unverified download (spec §2 D-CONT-6, fleco 6).
RUN set -eu; \
    case "${TARGETARCH}" in \
      arm64) LEFTHOOK_ASSET="Linux_arm64"; LEFTHOOK_SHA256="${LEFTHOOK_SHA256_ARM64}" ;; \
      amd64) LEFTHOOK_ASSET="Linux_x86_64"; LEFTHOOK_SHA256="${LEFTHOOK_SHA256_AMD64}" ;; \
      *) echo "unsupported TARGETARCH: ${TARGETARCH}" >&2; exit 1 ;; \
    esac; \
    curl -fsSL "https://github.com/evilmartians/lefthook/releases/download/v${LEFTHOOK_VERSION}/lefthook_${LEFTHOOK_VERSION}_${LEFTHOOK_ASSET}" \
      -o /usr/local/bin/lefthook; \
    echo "${LEFTHOOK_SHA256}  /usr/local/bin/lefthook" | sha256sum -c -; \
    chmod +x /usr/local/bin/lefthook

# Bake in the pnpm shim (pinned by packageManager in package.json) so `pnpm` and tools it spawns
# (e.g. `astro add`) find it on PATH without the per-invocation workaround the bootstrap container
# needed (corepack does not put pnpm on PATH by default, only `corepack pnpm` — see
# task-W-1-progress.md, WEB-1).
RUN corepack enable

# node:24-bookworm-slim already ships a non-root `node` user (uid/gid 1000, D-CONT-4 principle of
# least privilege). Rewrite it to match the host UID/GID from .env so bind-mounted files stay
# writable by the invoking user (D-CONT-2). On macOS hosts GID 20 ("staff") collides with Debian's
# preexisting "dialout" group, so `groupmod` is only used when the target GID is free; otherwise the
# node user just adopts the existing group numerically (the group's *name* doesn't matter here, only
# the numeric id used for bind-mount file ownership).
RUN if [ "${UID}" != "1000" ] || [ "${GID}" != "1000" ]; then \
      if getent group "${GID}" >/dev/null 2>&1; then \
        usermod -u "${UID}" -g "${GID}" node; \
      else \
        groupmod -g "${GID}" node && usermod -u "${UID}" -g "${GID}" node; \
      fi && \
      chown -R "${UID}:${GID}" /home/node; \
    fi

# Pre-create the mount points for the named volumes (node_modules, pnpm-store) owned by the final
# UID/GID: Docker seeds a fresh named volume from whatever already exists at that path in the image,
# so without this the volume is created root-owned and `node` can't write into it.
RUN mkdir -p /workspace/node_modules /pnpm-store && chown -R "${UID}:${GID}" /workspace /pnpm-store

USER node
WORKDIR /workspace
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
