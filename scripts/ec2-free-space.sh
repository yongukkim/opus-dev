#!/usr/bin/env bash
# ENOSPC 복구용. EC2에서 안전하게 디스크 확보 (swap·docker·apt 캐시 정리).
set -euo pipefail

echo '[before]'; df -h / || true; swapon --show || true

# 1) 기존 /swapfile 제거 (4G가 루트를 차지하던 이전 실행 잔재)
if swapon --show=NAME --noheadings | grep -qx '/swapfile'; then
  sudo swapoff /swapfile || true
fi
if [[ -f /swapfile ]]; then
  sudo rm -f /swapfile
fi
sudo sed -i '\|^/swapfile|d' /etc/fstab || true

# 2) Docker 빌드 캐시·미사용 이미지·컨테이너·볼륨 정리
if command -v docker >/dev/null 2>&1; then
  sudo docker system prune -af --volumes || true
  sudo docker builder prune -af || true
fi

# 3) apt 캐시 정리
sudo apt-get clean || true
sudo rm -rf /var/lib/apt/lists/* || true

# 4) 저장소 안 무거운 흔적 제거 (현재 쓰는 브랜치에서는 이미 빠져 있음)
rm -rf "$HOME/opus-dev/Web_Template" 2>/dev/null || true

echo '[after]'; df -h / || true; swapon --show || true
