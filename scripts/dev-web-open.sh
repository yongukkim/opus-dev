#!/bin/sh
# OPUS 웹 미리보기: 개발 서버 + (macOS) 브라우저 자동 오픈
# 사용: 프로젝트 루트에서  pnpm web
# 다른 포트: PORT=3001 pnpm web

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PORT="${PORT:-4321}"
URL="http://127.0.0.1:${PORT}/"

printf "\n  OPUS 웹 → %s\n  (중지: Ctrl+C)\n\n" "$URL"

if command -v open >/dev/null 2>&1; then
  (sleep 3 && open "$URL") &
fi

exec pnpm --filter @opus/web exec next dev --turbopack -p "$PORT"
