#!/usr/bin/env bash
# EC2에서 수동으로 최신 이미지를 pull 하고 컨테이너를 재기동하는 helper.
# 주로 디버깅/응급 복구용. 평소에는 GitHub Actions(build-and-deploy-web)이 자동 호출한다.
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/opus-dev}"
BRANCH="${BRANCH:-main}"
OPUS_WEB_IMAGE="${OPUS_WEB_IMAGE:-ghcr.io/yongukkim/opus-web:latest}"

if [[ ! -d "$APP_DIR/.git" ]]; then
  git clone --depth 1 --branch "$BRANCH" https://github.com/yongukkim/opus-dev.git "$APP_DIR"
else
  git -C "$APP_DIR" fetch --depth 1 origin "$BRANCH"
  git -C "$APP_DIR" checkout "$BRANCH"
  git -C "$APP_DIR" reset --hard "origin/$BRANCH"
fi

cd "$APP_DIR"
export OPUS_WEB_IMAGE

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
