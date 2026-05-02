#!/usr/bin/env bash
# EC2에서 수동으로 최신 이미지를 pull 하고 컨테이너를 재기동하는 helper.
# 주로 디버깅/응급 복구용. 평소에는 GitHub Actions(build-and-deploy-web)이 자동 호출한다.
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/opus-dev}"
BRANCH="${BRANCH:-main}"
OPUS_WEB_IMAGE="${OPUS_WEB_IMAGE:-ghcr.io/yongukkim/opus-web:latest}"
OPUS_CONSOLE_IMAGE="${OPUS_CONSOLE_IMAGE:-}"
BASE_URL="${BASE_URL:-https://app.opus-store.com}"
OPUS_ALERT_WEBHOOK="${OPUS_ALERT_WEBHOOK:-}"

notify() {
  local level="$1"
  local msg="$2"
  if [[ -z "$OPUS_ALERT_WEBHOOK" ]]; then
    return 0
  fi
  curl -sS -X POST "$OPUS_ALERT_WEBHOOK" \
    -H "Content-Type: application/json" \
    -d "{\"text\":\"[opus-deploy][$level] $msg\"}" >/dev/null || true
}

trap 'notify "fail" "branch=$BRANCH web=$OPUS_WEB_IMAGE host=$(hostname)"; exit 1' ERR

if [[ ! -d "$APP_DIR/.git" ]]; then
  git clone --depth 1 --branch "$BRANCH" https://github.com/yongukkim/opus-dev.git "$APP_DIR"
else
  git -C "$APP_DIR" fetch --depth 1 origin "$BRANCH"
  git -C "$APP_DIR" checkout "$BRANCH"
  git -C "$APP_DIR" reset --hard "origin/$BRANCH"
fi

cd "$APP_DIR"
export OPUS_WEB_IMAGE

# Compose v2 merges host COMPOSE_FILE with -f; storefront EC2 must not inherit compose.console.yaml from shell profile.
unset COMPOSE_FILE

# Always take a point-in-time storage backup before rollout.
if [[ -x "$APP_DIR/scripts/backup-opus-storage.sh" ]]; then
  APP_DIR="$APP_DIR" COMPOSE_FILE="compose.web.yaml" "$APP_DIR/scripts/backup-opus-storage.sh"
else
  echo "[ec2-pull-restart] WARN: backup-opus-storage.sh missing or not executable" >&2
fi

# On small EC2 disks, stale layers from previous deploys can block new pulls.
# Best-effort cleanup keeps deploy automation resilient to "no space left on device".
docker image prune -af || true
docker container prune -f || true
docker builder prune -af || true

docker pull "$OPUS_WEB_IMAGE"

# ISO 27001 A.12.1.2 / A.14.2.8 (§5, §8): run Prisma migrations before exposing the new container so schema
# drift can never serve traffic. Uses the same image + /etc/opus/opus.env so DATABASE_URL is injected at runtime.
# KO: 새 컨테이너가 트래픽을 받기 전에 마이그레이션을 적용한다.
# JA: 新しいコンテナがトラフィックを受ける前にマイグレーションを適用する。
# EN: Apply DB migrations before the new container accepts traffic.
if [[ -f /etc/opus/opus.env ]]; then
  docker run --rm \
    --env-file /etc/opus/opus.env \
    "$OPUS_WEB_IMAGE" \
    node node_modules/prisma/build/index.js migrate deploy --schema=apps/web/prisma/schema.prisma
else
  echo "[ec2-pull-restart] WARN: /etc/opus/opus.env missing — skipping prisma migrate deploy" >&2
fi

docker compose -f compose.web.yaml up -d
docker compose -f compose.web.yaml ps

# ISO 27001 A.10.1.1 (§3) — `compose up -d` may skip unchanged caddy; recreate forces re-read of bind-mounted Caddyfile + LE retry.
# KO: Caddy 컨테이너가 그대로면 마운트된 Caddyfile 변경·SAN 갱신이 TLS에 반영되지 않을 수 있어 항상 재생성한다.
# JA: CaddyコンテナがそのままだとマウントされたCaddyfile変更がTLSに反映されないことがあるため常に再作成する。
# EN: If the caddy container is unchanged, bind-mount updates may not affect TLS; always force-recreate caddy after up.
if docker compose -f compose.web.yaml ps -q caddy >/dev/null 2>&1; then
  echo "[ec2-pull-restart] recreating caddy to apply Caddyfile / certificates"
  docker compose -f compose.web.yaml up -d --force-recreate --no-deps caddy
fi

# Root-owned 시드(JSONL·private) 직후 nextjs 가 append 하지 못하는 문제 방지.
bash "$APP_DIR/scripts/ec2-chown-web-storage.sh"

# Post-deploy production smoke checks (fail-fast on boundary regressions).
if [[ -x "$APP_DIR/scripts/ops-web-stability-check.sh" ]]; then
  APP_DIR="$APP_DIR" COMPOSE_FILE="compose.web.yaml" BASE_URL="$BASE_URL" \
    bash "$APP_DIR/scripts/ops-web-stability-check.sh"
else
  echo "[ec2-pull-restart] WARN: ops-web-stability-check.sh missing or not executable" >&2
fi

if [[ -x "$APP_DIR/scripts/ops-release-e2e-check.sh" ]]; then
  APP_DIR="$APP_DIR" COMPOSE_FILE="compose.web.yaml" BASE_URL="$BASE_URL" \
    bash "$APP_DIR/scripts/ops-release-e2e-check.sh"
else
  echo "[ec2-pull-restart] WARN: ops-release-e2e-check.sh missing or not executable" >&2
fi

notify "ok" "branch=$BRANCH web=$OPUS_WEB_IMAGE host=$(hostname) base=$BASE_URL"
