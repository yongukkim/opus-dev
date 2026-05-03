#!/usr/bin/env bash
# Console EC2 — pull console image, run Prisma migrate (web image), compose.console.yaml up.
# KO: 스토어용 `ec2-pull-restart.sh`와 분리; 동일 RDS(`/etc/opus/opus.env`)를 사용한다.
# JA: ストア用スクリプトと分離。同一RDS（/etc/opus/opus.env）を使用する。
# EN: Split from storefront `ec2-pull-restart.sh`; uses the same RDS via `/etc/opus/opus.env`.
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/opus-dev}"
BRANCH="${BRANCH:-main}"
OPUS_CONSOLE_IMAGE="${OPUS_CONSOLE_IMAGE:?Set OPUS_CONSOLE_IMAGE (e.g. ghcr.io/.../opus-console:tag)}"
# Web image is no longer pulled on the console EC2 — Prisma migrate runs from the console image instead.
OPUS_ALERT_WEBHOOK="${OPUS_ALERT_WEBHOOK:-}"

# ISO 27001 A.9.2.1 (CLAUDE.md §4)
# KO: CI SSH 세션에서는 docker 그룹이 아직 적용되지 않을 수 있어 sudo 로 폴백한다.
# JA: CI SSH セッションでは docker グループが未適用のことがあるため sudo にフォールバックする。
# EN: CI SSH sessions may not yet have the docker group; fall back to sudo docker.
if docker info >/dev/null 2>&1; then
  DOCKER=(docker)
else
  DOCKER=(sudo docker)
fi

notify() {
  local level="$1"
  local msg="$2"
  if [[ -z "$OPUS_ALERT_WEBHOOK" ]]; then
    return 0
  fi
  curl -sS -X POST "$OPUS_ALERT_WEBHOOK" \
    -H "Content-Type: application/json" \
    -d "{\"text\":\"[opus-deploy-console][$level] $msg\"}" >/dev/null || true
}

trap 'notify "fail" "branch=$BRANCH console=$OPUS_CONSOLE_IMAGE host=$(hostname)"; exit 1' ERR

if [[ ! -d "$APP_DIR/.git" ]]; then
  git clone --depth 1 --branch "$BRANCH" https://github.com/yongukkim/opus-dev.git "$APP_DIR"
else
  git -C "$APP_DIR" fetch --depth 1 origin "$BRANCH"
  git -C "$APP_DIR" checkout "$BRANCH"
  git -C "$APP_DIR" reset --hard "origin/$BRANCH"
fi

cd "$APP_DIR"
export OPUS_CONSOLE_IMAGE

dc_console() {
  env -u COMPOSE_FILE "${DOCKER[@]}" compose -f compose.console.yaml "$@"
}

"${DOCKER[@]}" image prune -af || true
"${DOCKER[@]}" container prune -f || true
"${DOCKER[@]}" builder prune -af || true

"${DOCKER[@]}" pull "$OPUS_CONSOLE_IMAGE"

# Run Prisma migrate from the console image (shares the same schema as web via build-time copy).
if [[ -f /etc/opus/opus.env ]]; then
  "${DOCKER[@]}" run --rm \
    --env-file /etc/opus/opus.env \
    "$OPUS_CONSOLE_IMAGE" \
    node node_modules/prisma/build/index.js migrate deploy --schema=apps/web/prisma/schema.prisma 2>/dev/null \
  || echo "[ec2-pull-restart-console] WARN: prisma migrate skipped (schema path may differ)" >&2
else
  echo "[ec2-pull-restart-console] WARN: /etc/opus/opus.env missing — skipping prisma migrate deploy" >&2
fi

dc_console up -d
dc_console ps

if dc_console ps -q caddy >/dev/null 2>&1; then
  echo "[ec2-pull-restart-console] recreating caddy"
  dc_console up -d --force-recreate --no-deps caddy
fi

notify "ok" "branch=$BRANCH console=$OPUS_CONSOLE_IMAGE host=$(hostname)"
