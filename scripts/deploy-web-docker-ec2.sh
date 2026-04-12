#!/usr/bin/env bash
# EC2(Ubuntu)에서 OPUS 웹을 Docker로 띄웁니다. 기본값은 이 저장소·현재 작업 브랜치 기준입니다.
# 다른 브랜치: BRANCH=main ./scripts/deploy-web-docker-ec2.sh
# 비공개 저장소: REPO_URL에 PAT 또는 EC2에 deploy key 설정 후 SSH URL 사용.
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/yongukkim/opus-dev.git}"
BRANCH="${BRANCH:-feat/signup-sso-collector}"
APP_DIR="${APP_DIR:-$HOME/opus-dev}"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker가 없습니다. 예: sudo apt update && sudo apt install -y docker.io docker-compose-plugin && sudo usermod -aG docker \"\$USER\" (재로그인)"
  exit 1
fi

if [[ ! -d "$APP_DIR/.git" ]]; then
  git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
else
  git -C "$APP_DIR" fetch origin "$BRANCH" --depth 1
  git -C "$APP_DIR" checkout "$BRANCH"
  git -C "$APP_DIR" reset --hard "origin/$BRANCH"
fi

cd "$APP_DIR"
docker compose -f compose.web.yaml build
docker compose -f compose.web.yaml up -d

echo "브라우저에서 http://$(curl -sSf https://checkip.amazonaws.com/)/ 접속 (또는 이 인스턴스 퍼블릭 IP). 보안 그룹에서 80 허용 확인."
