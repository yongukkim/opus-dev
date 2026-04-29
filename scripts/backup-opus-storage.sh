#!/usr/bin/env bash
# Backup OPUS docker volume data to compressed tarballs.
#
# ISO 27001 A.12.3.1 / A.12.1.2 (CLAUDE.md §5):
#   KO: 운영 데이터는 정기 백업으로 보존하고, 인스턴스 교체 시에도 복구 가능한 형태로 유지한다.
#   JA: 運用データは定期バックアップで保全し、インスタンス交換時にも復元可能な形式で保持する。
#   EN: Preserve operational data with periodic backups in a restorable format across instance replacement.
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/opus-dev}"
COMPOSE_FILE="${COMPOSE_FILE:-compose.web.yaml}"
SERVICE_NAME="${SERVICE_NAME:-opus-web}"
BACKUP_ROOT="${BACKUP_ROOT:-/var/backups/opus-storage}"
KEEP_DAYS="${KEEP_DAYS:-14}"

log() { printf '[backup-opus-storage] %s\n' "$*"; }
die() { printf '[backup-opus-storage] ERROR: %s\n' "$*" >&2; exit 1; }

dc() {
  if docker info >/dev/null 2>&1; then
    docker compose "$@"
  else
    sudo docker compose "$@"
  fi
}

if [[ ! -d "$APP_DIR" ]]; then
  die "APP_DIR not found: $APP_DIR"
fi

cd "$APP_DIR"
CID="$(dc -f "$COMPOSE_FILE" ps -q "$SERVICE_NAME" 2>/dev/null || true)"
if [[ -z "${CID:-}" ]]; then
  die "service '$SERVICE_NAME' is not running"
fi

SRC="$(docker inspect "$CID" --format '{{range .Mounts}}{{if eq .Destination "/app/storage"}}{{.Source}}{{end}}{{end}}')"
if [[ -z "${SRC:-}" ]]; then
  die "could not resolve /app/storage mount source from container: $CID"
fi
if ! sudo test -d "$SRC"; then
  die "storage source does not exist: $SRC"
fi

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
HOST_TAG="$(hostname -s 2>/dev/null || hostname)"
OUT_DIR="${BACKUP_ROOT%/}"
OUT_FILE="${OUT_DIR}/opus-storage-${HOST_TAG}-${STAMP}.tgz"

sudo install -d -m 0750 -o root -g root "$OUT_DIR"
log "source=$SRC"
log "backup=$OUT_FILE"
sudo tar -C "$SRC" -czf "$OUT_FILE" .
sudo chmod 0640 "$OUT_FILE"
sudo find "$OUT_DIR" -type f -name 'opus-storage-*.tgz' -mtime "+$KEEP_DAYS" -delete
sudo ls -lh "$OUT_FILE"
log "done"
