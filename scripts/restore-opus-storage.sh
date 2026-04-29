#!/usr/bin/env bash
# Restore OPUS docker volume data from a backup tarball.
#
# ISO 27001 A.12.3.1 / A.12.1.2 (CLAUDE.md §5):
#   KO: 백업 파일로 운영 데이터를 복원할 때 대상 경로를 검증하고 소유권을 정합시킨다.
#   JA: バックアップから運用データを復元する際、復元先パスを検証し所有権を整合させる。
#   EN: Validate restore target paths and ownership when recovering operational data from backups.
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/opus-dev}"
COMPOSE_FILE="${COMPOSE_FILE:-compose.web.yaml}"
SERVICE_NAME="${SERVICE_NAME:-opus-web}"
BACKUP_FILE="${1:-}"

log() { printf '[restore-opus-storage] %s\n' "$*"; }
die() { printf '[restore-opus-storage] ERROR: %s\n' "$*" >&2; exit 1; }

dc() {
  if docker info >/dev/null 2>&1; then
    docker compose "$@"
  else
    sudo docker compose "$@"
  fi
}

if [[ -z "$BACKUP_FILE" ]]; then
  die "usage: scripts/restore-opus-storage.sh /path/to/opus-storage-*.tgz"
fi
if [[ ! -f "$BACKUP_FILE" ]]; then
  die "backup file not found: $BACKUP_FILE"
fi
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

log "stopping service: $SERVICE_NAME"
dc -f "$COMPOSE_FILE" stop "$SERVICE_NAME"

log "restoring $BACKUP_FILE -> $SRC"
sudo tar -C "$SRC" -xzf "$BACKUP_FILE"
sudo chown -R 1001:1001 "$SRC"

log "starting service: $SERVICE_NAME"
dc -f "$COMPOSE_FILE" up -d "$SERVICE_NAME"
dc -f "$COMPOSE_FILE" ps "$SERVICE_NAME"
log "done"
