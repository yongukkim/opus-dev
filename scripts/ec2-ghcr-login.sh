#!/usr/bin/env bash
# GHCR login for EC2 deploy — uses a temp DOCKER_CONFIG so a full $HOME does not block login.
set -euo pipefail

log() { printf '[ec2-ghcr-login] %s\n' "$*"; }
warn() { printf '[ec2-ghcr-login] WARN: %s\n' "$*" >&2; }

docker_cmd() {
  if docker info >/dev/null 2>&1; then
    docker "$@"
  else
    sudo docker "$@"
  fi
}

opus_ghcr_login() {
  local token="${GHCR_TOKEN:-${GITHUB_TOKEN:-}}"
  local user="${GHCR_USER:-${GITHUB_ACTOR:-}}"
  if [[ -z "$token" || -z "$user" ]]; then
    warn "GHCR_TOKEN and GHCR_USER (or GITHUB_TOKEN/GITHUB_ACTOR) required"
    return 1
  fi

  local tmp
  tmp="$(mktemp -d)"
  export DOCKER_CONFIG="${tmp}/docker"
  mkdir -p "$DOCKER_CONFIG"
  chmod 700 "$DOCKER_CONFIG"

  log "registry=ghcr.io user=$user config=$DOCKER_CONFIG"
  if docker info >/dev/null 2>&1; then
    if echo "$token" | docker login ghcr.io -u "$user" --password-stdin; then
      return 0
    fi
  elif echo "$token" | sudo DOCKER_CONFIG="$DOCKER_CONFIG" docker login ghcr.io -u "$user" --password-stdin; then
    return 0
  fi
  warn "login failed — check disk space on / and $HOME"
  return 1
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  opus_ghcr_login
fi
