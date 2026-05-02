#!/usr/bin/env bash
# EC2: JSONL·private 스토리지를 `docker exec -u 0` 로 시드한 뒤 런타임 사용자(nextjs)가
# append(예: collector-transfer-listings.jsonl)할 수 있도록 소유권을 맞춘다.
#
# ISO 27001 A.9.2.1 / A.12.1.2 (CLAUDE.md §4, §5):
#   KO: 앱 전용 계정이 쓰는 디렉터리는 해당 UID/GID 소유로 두어 불필요한 권한 상승 없이 기록한다.
#   JA: アプリ専用ユーザーが書くディレクトリを同一 UID/GID 所有にし、不要な権限昇格なしで追記できるようにする。
#   EN: Directories the app user writes must be owned by that UID/GID so ledgers append without privilege escalation.
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/opus-dev}"
COMPOSE_FILE="${COMPOSE_FILE:-compose.web.yaml}"

if [[ ! -d "$APP_DIR" ]]; then
  printf 'ec2-chown-web-storage: APP_DIR not found: %s\n' "$APP_DIR" >&2
  exit 1
fi
cd "$APP_DIR"

dc() {
  if docker info >/dev/null 2>&1; then
    env -u COMPOSE_FILE docker compose "$@"
  else
    sudo env -u COMPOSE_FILE docker compose "$@"
  fi
}

de() {
  if docker info >/dev/null 2>&1; then
    docker "$@"
  else
    sudo docker "$@"
  fi
}

CID="$(dc -f "$COMPOSE_FILE" ps -q opus-web 2>/dev/null || true)"
if [[ -z "${CID:-}" ]]; then
  printf 'ec2-chown-web-storage: opus-web not running — nothing to do\n' >&2
  exit 0
fi

de exec -u 0 "$CID" sh -lc '
  for d in /app/apps/web/storage /app/storage; do
    if [ -d "$d" ]; then
      chown -R nextjs:nodejs "$d"
      printf "chowned %s\n" "$d"
    fi
  done
'
