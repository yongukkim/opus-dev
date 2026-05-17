#!/usr/bin/env bash
# Best-effort disk reclamation before git / docker login / backup on small EC2 root volumes.
#
# ISO 27001 A.12.1.2 (§5):
#   KO: 배포·백업 전 루트 볼륨 여유를 확보해 자동화 중단(no space)을 줄인다.
#   JA: デプロイ・バックアップ前にルートボリュームの空きを確保し、自動化の no space 停止を減らす。
#   EN: Reclaim root volume space before deploy/backup to reduce no-space automation failures.
set -euo pipefail

BACKUP_ROOT="${BACKUP_ROOT:-/var/backups/opus-storage}"
KEEP_NEWEST_BACKUPS="${KEEP_NEWEST_BACKUPS:-2}"

log() { printf '[ec2-free-disk] %s\n' "$*"; }

docker_cmd() {
  if docker info >/dev/null 2>&1; then
    docker "$@"
  else
    sudo docker "$@"
  fi
}

opus_free_disk_for_deploy() {
  log "before: $(df -h / | awk 'NR==2 {print $3 " used / " $2 " (" $5 ")"}')"

  docker_cmd system prune -af || true
  docker_cmd builder prune -af || true
  docker_cmd container prune -f || true

  if [[ -d "$BACKUP_ROOT" ]]; then
    mapfile -t archives < <(
      sudo find "$BACKUP_ROOT" -type f -name 'opus-storage-*.tgz' -printf '%T@ %p\n' 2>/dev/null |
        sort -n |
        awk '{ $1=""; sub(/^ /,""); print }'
    )
    local count="${#archives[@]}"
    if (( count > KEEP_NEWEST_BACKUPS )); then
      local drop=$((count - KEEP_NEWEST_BACKUPS))
      log "removing $drop old storage backup(s)"
      for ((i = 0; i < drop; i++)); do
        sudo rm -f "${archives[$i]}"
      done
    fi
  fi

  sudo journalctl --vacuum-size=80M 2>/dev/null || true
  rm -rf "${HOME:-/home/ubuntu}"/.cache/* 2>/dev/null || true

  log "after:  $(df -h / | awk 'NR==2 {print $3 " used / " $2 " (" $5 ")"}')"
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  opus_free_disk_for_deploy
fi
