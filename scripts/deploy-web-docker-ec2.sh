#!/usr/bin/env bash
# EC2(Ubuntu, arm64, t4g.micro 전제)에서 OPUS 웹 컨테이너를 띄우는 단일 스크립트.
# 용도:
#   1) 이 스크립트만 EC2로 가져가 실행해도 됨 (curl | bash 형태로도 가능)
#   2) 기본은 소스 코드 clone 후 Docker 이미지 빌드
#   3) OPUS_WEB_IMAGE 를 주면 레지스트리에서 pull (t4g.micro 빌드 부담 회피)
# 예:
#   curl -fsSL https://raw.githubusercontent.com/yongukkim/opus-dev/feat/signup-sso-collector/scripts/deploy-web-docker-ec2.sh | bash
#   OPUS_WEB_IMAGE=ghcr.io/yongukkim/opus-web:latest BRANCH=main bash scripts/deploy-web-docker-ec2.sh

set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/yongukkim/opus-dev.git}"
BRANCH="${BRANCH:-main}"
APP_DIR="${APP_DIR:-$HOME/opus-dev}"
# 8GB 루트에서 4G 스왑은 Docker 빌드와 충돌 → 기본 2G (환경변수로 조절)
SWAP_SIZE_GB="${SWAP_SIZE_GB:-2}"
SWAP_FILE="${SWAP_FILE:-/swapfile}"
OPUS_WEB_IMAGE="${OPUS_WEB_IMAGE:-}"

log() { printf '\n==> %s\n' "$*"; }
die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

log "EC2 진단: 호스트 $(hostname), 메모리 / 디스크"
free -h || true
df -h / || true

# ---------- 1) 스왑 자동 구성 (RAM < 2GB 이고 스왑이 거의 없을 때만) ----------
mem_mb=$(awk '/MemTotal/ {printf "%d", $2/1024}' /proc/meminfo)
swap_mb=$(awk '/SwapTotal/ {printf "%d", $2/1024}' /proc/meminfo)
# df 4번째 칼럼 = 사용 가능 1K 블록 수 (Ubuntu 기본)
avail_kb=$(df / | awk 'NR==2 {print int($4)}')
avail_gb=$((avail_kb / 1024 / 1024))
# 루트 디스크에 스왑 + Docker 빌드 최소 여유를 남길 때만 스왑 생성.
# KO: t4g.micro(8G 루트)에서 예전 +4G 조건은 스왑이 거의 안 생겨 next build OOM/SSH 멈춤처럼 보였다.
# JA: 旧+4G条件ではスワップが作られず next build でメモリ枯渇しSSHが固まった。
# EN: The old +4GiB gate skipped swap on 8GiB roots; Next build then thrashed and SSH looked hung.
need_gb=$((SWAP_SIZE_GB + 2))
if [[ "$mem_mb" -lt 2048 && "$swap_mb" -lt 512 && "$avail_gb" -ge "$need_gb" ]]; then
  log "RAM ${mem_mb}MiB, swap ${swap_mb}MiB, / 여유 ${avail_gb}G → ${SWAP_SIZE_GB}G 스왑 (${SWAP_FILE})"
  if [[ ! -f "$SWAP_FILE" ]]; then
    sudo fallocate -l "${SWAP_SIZE_GB}G" "$SWAP_FILE" || sudo dd if=/dev/zero of="$SWAP_FILE" bs=1M count=$((SWAP_SIZE_GB * 1024))
    sudo chmod 600 "$SWAP_FILE"
    sudo mkswap "$SWAP_FILE"
  fi
  sudo swapon "$SWAP_FILE" || true
  if ! grep -q "^${SWAP_FILE} " /etc/fstab 2>/dev/null; then
    echo "${SWAP_FILE} none swap sw 0 0" | sudo tee -a /etc/fstab >/dev/null
  fi
elif [[ "$mem_mb" -lt 2048 && "$swap_mb" -lt 512 ]]; then
  log "스왑 생략: / 여유 ${avail_gb}G < 필요 ${need_gb}G (EBS 루트 볼륨 확장 또는 SWAP_SIZE_GB 낮춤 권장)"
else
  log "스왑 OK (RAM ${mem_mb}MiB, swap ${swap_mb}MiB) — 추가 생성 안 함"
fi

# ---------- 2) 필수 패키지 확인 ----------
if ! command -v git >/dev/null 2>&1; then
  log "git 설치"
  sudo apt-get update -y
  sudo apt-get install -y --no-install-recommends git
fi
command -v docker >/dev/null 2>&1 || die "Docker가 없습니다. 먼저 Docker Engine을 설치하세요."
# compose v2 (docker compose) 존재 확인
if ! docker compose version >/dev/null 2>&1; then
  log "docker-compose-plugin 설치"
  sudo apt-get update -y
  sudo apt-get install -y --no-install-recommends docker-compose-plugin
fi
# sudo 없이 docker 쓸 수 있게
if ! docker info >/dev/null 2>&1; then
  log "현재 사용자($USER)를 docker 그룹에 추가. 새 SSH 세션에서 다시 실행하면 sudo 없이 동작합니다."
  sudo usermod -aG docker "$USER" || true
  # 현재 세션은 우회를 위해 sudo docker 사용
  SUDO_DOCKER="sudo "
else
  SUDO_DOCKER=""
fi

# ---------- 3) 소스 동기화 ----------
if [[ ! -d "$APP_DIR/.git" ]]; then
  log "리포 클론: $REPO_URL ($BRANCH) → $APP_DIR"
  git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
else
  log "리포 업데이트: $APP_DIR ($BRANCH)"
  git -C "$APP_DIR" fetch --depth 1 origin "$BRANCH"
  git -C "$APP_DIR" checkout "$BRANCH"
  git -C "$APP_DIR" reset --hard "origin/$BRANCH"
fi

cd "$APP_DIR"

# 예전 클론에만 남아 있을 수 있음(Web_Template/ 는 Git·Docker에서 제외 — 루트 디스크 절약)
if [[ -d Web_Template ]]; then
  log "Web_Template/ 삭제(디스크 절약, OPUS 웹 빌드에 불필요)"
  rm -rf Web_Template
fi

log "디스크(/, Docker 데이터)"
df -h / 2>/dev/null | head -5 || true
df -h /var/lib/docker 2>/dev/null | head -3 || true
if [[ "${avail_gb:-0}" -lt 5 ]]; then
  log "여유 디스크가 부족합니다. AWS 콘솔에서 루트 EBS를 30GB 이상으로 늘린 뒤(온라인 확장), EC2에서 한 번 실행:"
  log "  sudo apt-get install -y cloud-guest-utils && sudo growpart /dev/nvme0n1 1 && sudo resize2fs /dev/nvme0n1p1"
  log "(디스크 이름은 lsblk 로 확인. xvda/sda 인 경우도 있음.)"
fi

# ---------- 4) 빌드 또는 pull ----------
if [[ -n "$OPUS_WEB_IMAGE" ]]; then
  log "레지스트리 이미지 사용: $OPUS_WEB_IMAGE"
  export OPUS_WEB_IMAGE
  ${SUDO_DOCKER}docker pull "$OPUS_WEB_IMAGE"
else
  log "EC2에서 로컬 빌드 (시간 걸릴 수 있음, 로그를 지켜봐 주세요)"
  log "Docker 빌드 캐시·미사용 이미지 정리 (ENOSPC 방지)"
  sudo docker builder prune -af 2>/dev/null || true
  sudo docker image prune -af 2>/dev/null || true
  sudo docker system prune -af 2>/dev/null || true
  DOCKER_BUILDKIT=1 ${SUDO_DOCKER}docker compose -f compose.web.yaml build
fi

log "컨테이너 재기동"
${SUDO_DOCKER}docker compose -f compose.web.yaml up -d

log "컨테이너 상태"
${SUDO_DOCKER}docker compose -f compose.web.yaml ps

# ---------- 5) 헬스체크 ----------
log "내부에서 HTTP 확인 (최대 60초 대기)"
ok=0
for i in $(seq 1 30); do
  code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 3 http://127.0.0.1/ || true)
  if [[ "$code" =~ ^(2|3)[0-9][0-9]$ ]]; then ok=1; break; fi
  sleep 2
done
if [[ "$ok" != 1 ]]; then
  log "HTTP 응답 없음 — 컨테이너 로그 마지막 80줄"
  ${SUDO_DOCKER}docker compose -f compose.web.yaml logs --tail=80 || true
  die "앱이 아직 응답하지 않습니다."
fi

public_ip="$(curl -sSf --max-time 3 https://checkip.amazonaws.com/ || true)"
log "성공: http://${public_ip:-<인스턴스-퍼블릭-IP>}/  (로케일 경로 예: /ko/, /ja/)"
