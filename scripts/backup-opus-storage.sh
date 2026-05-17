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
KEEP_NEWEST="${KEEP_NEWEST:-3}"
MIN_FREE_MB="${MIN_FREE_MB:-512}"

log() { printf '[backup-opus-storage] %s\n' "$*"; }
warn() { printf '[backup-opus-storage] WARN: %s\n' "$*" >&2; }
die() { printf '[backup-opus-storage] ERROR: %s\n' "$*" >&2; exit 1; }

free_mb_on_path() {
  local path="$1"
  df -BM "$path" 2>/dev/null | awk 'NR==2 { gsub(/M/, "", $4); print $4 }'
}

prune_old_backups() {
  local out_dir="$1"
  sudo find "$out_dir" -type f -name 'opus-storage-*.tgz' -mtime "+$KEEP_DAYS" -delete 2>/dev/null || true
  # When the root volume is full, drop oldest archives until only KEEP_NEWEST remain.
  mapfile -t archives < <(sudo find "$out_dir" -type f -name 'opus-storage-*.tgz' -printf '%T@ %p\n' 2>/dev/null | sort -n | awk '{ $1=""; sub(/^ /,""); print }')
  local count="${#archives[@]}"
  if (( count > KEEP_NEWEST )); then
    local drop=$((count - KEEP_NEWEST))
    log "pruning $drop oldest backup(s) (keep newest $KEEP_NEWEST)"
    for ((i = 0; i < drop; i++)); do
      sudo rm -f "${archives[$i]}"
    done
  fi
}

dc() {
  if docker info >/dev/null 2>&1; then
    env -u COMPOSE_FILE docker compose "$@"
  else
    sudo env -u COMPOSE_FILE docker compose "$@"
  fi
}

if [[ ! -d "$APP_DIR" ]]; then
  die "APP_DIR not found: $APP_DIR"
fi

cd "$APP_DIR"
CID="$(dc -f "$COMPOSE_FILE" ps -q "$SERVICE_NAME" 2>/dev/null || true)"
if [[ -z "${CID:-}" ]]; then
  log "skip: service '$SERVICE_NAME' is not running (cold host or first deploy — no volume snapshot this cycle)"
  exit 0
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
prune_old_backups "$OUT_DIR"

FREE_MB="$(free_mb_on_path "$OUT_DIR" || echo 0)"
if [[ -z "$FREE_MB" || "$FREE_MB" -lt "$MIN_FREE_MB" ]]; then
  warn "skip: ${FREE_MB:-0}MiB free on backup volume (need >= ${MIN_FREE_MB}MiB) — prune /var/backups or docker images"
  exit 0
fi

log "source=$SRC"
log "backup=$OUT_FILE (free=${FREE_MB}MiB)"
if ! sudo tar -C "$SRC" -czf "$OUT_FILE" .; then
  sudo rm -f "$OUT_FILE" 2>/dev/null || true
  warn "backup failed (disk full?) — removed partial archive if any"
  exit 1
fi
sudo chmod 0640 "$OUT_FILE"
prune_old_backups "$OUT_DIR"
sudo ls -lh "$OUT_FILE"
log "done"
