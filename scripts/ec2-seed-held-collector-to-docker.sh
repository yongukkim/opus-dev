#!/usr/bin/env bash
# EC2 호스트(ubuntu, ~/opus-dev 클론 + Docker)에서 실행: Prisma로 이메일→User.id 조회 후
# apps/web/storage 에 JSONL·PNG를 쓰고, opus-web 컨테이너의 /app/apps/web/storage 로 복사한다.
#
# 전제: 호스트에 Node 20+ 와 pnpm 이 있고(또는 리포에서 한 번 pnpm install 됨), /etc/opus/opus.env 에 DATABASE_URL 이 있다.
# 호스트에 pnpm 이 없으면: 로컬에서 동일 DB로 `pnpm seed:held-demo -- 이메일` 실행 후
#   sudo docker cp "$HOME/opus-dev/apps/web/storage/." "$(sudo docker compose -f compose.web.yaml ps -q opus-web):/app/apps/web/storage/"
#   bash scripts/ec2-chown-web-storage.sh
#
# ISO 27001 A.9.2.1 / A.14.2.1 (CLAUDE.md §4, §1)
#   KO: 시드는 운영자가 의도한 환경에서만 실행하며, 컨테이너 스토리지와 동기화 후 nextjs 소유권을 맞춘다.
#   JA: シードは運用者が意図した環境でのみ実行し、コンテナストレージ同期後に nextjs 所有へ合わせる。
#   EN: Run seed only in intended ops contexts; sync into the container and align ownership to nextjs.
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/opus-dev}"
COMPOSE_FILE="${COMPOSE_FILE:-compose.web.yaml}"
EMAIL="${1:-}"

if [[ -z "$EMAIL" ]]; then
  printf 'Usage: %s <collector-email>\n' "$0" >&2
  printf 'Example: %s kimvisors@gmail.com\n' "$0" >&2
  exit 1
fi

if [[ ! -d "$APP_DIR" ]]; then
  printf 'APP_DIR not found: %s\n' "$APP_DIR" >&2
  exit 1
fi
cd "$APP_DIR"

if [[ -f /etc/opus/opus.env ]]; then
  set -a
  # shellcheck source=/dev/null
  source /etc/opus/opus.env
  set +a
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  printf 'ERROR: DATABASE_URL missing (e.g. in /etc/opus/opus.env).\n' >&2
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  printf 'ERROR: pnpm not on PATH. Install Node 20+ and pnpm on this host, or seed from a dev machine then docker cp storage (see script header).\n' >&2
  exit 1
fi

pnpm --filter @opus/web exec prisma generate >/dev/null
pnpm seed:held-demo -- "$EMAIL"

dc() {
  if docker info >/dev/null 2>&1; then docker compose "$@"; else sudo docker compose "$@"; fi
}
de() {
  if docker info >/dev/null 2>&1; then docker "$@"; else sudo docker "$@"; fi
}

CID="$(dc -f "$COMPOSE_FILE" ps -q opus-web 2>/dev/null || true)"
if [[ -z "${CID:-}" ]]; then
  printf 'ERROR: opus-web container not running.\n' >&2
  exit 1
fi

STORAGE_HOST="$APP_DIR/apps/web/storage"
de cp "$STORAGE_HOST/." "$CID:/app/apps/web/storage/"
bash "$APP_DIR/scripts/ec2-chown-web-storage.sh"

printf '\nOK — storage synced into opus-web. Open /ko/vault/transfer/register as %s (hard refresh).\n' "$EMAIL"
