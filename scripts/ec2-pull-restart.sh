#!/usr/bin/env bash
# EC2에서 수동으로 최신 이미지를 pull 하고 컨테이너를 재기동하는 helper.
# 주로 디버깅/응급 복구용. 평소에는 GitHub Actions(build-and-deploy-web)이 자동 호출한다.
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/opus-dev}"
BRANCH="${BRANCH:-feat/signup-sso-collector}"
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
docker pull "$OPUS_WEB_IMAGE"
docker compose -f compose.web.yaml up -d
docker compose -f compose.web.yaml ps
