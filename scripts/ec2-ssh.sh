#!/usr/bin/env bash
# Local → EC2 interactive shell (or remote command). Uses scripts/ec2-ssh.env (gitignored).
#
# ISO 27001 A.9.4.2 (§2) — SSH uses a dedicated identity file; no keys in repo.
# KO: 저장소 밖의 개인키 경로만 참조하고, 호스트 키는 첫 접속 시 accept-new로 고정한다.
# JA: リポ外の秘密鍵パスのみを参照し、初回は accept-new でホスト鍵を固定する。
# EN: Reference only an out-of-repo private key path; pin host keys on first connect via accept-new.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT/scripts/ec2-ssh.env"

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck source=/dev/null
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

: "${OPUS_EC2_USER:?Set OPUS_EC2_USER (see scripts/ec2-ssh.env.example)}"
: "${OPUS_EC2_HOST:?Set OPUS_EC2_HOST}"
: "${OPUS_EC2_IDENTITY_FILE:?Set OPUS_EC2_IDENTITY_FILE}"

if [[ ! -f "$OPUS_EC2_IDENTITY_FILE" ]]; then
  echo "ec2-ssh: identity file not found: $OPUS_EC2_IDENTITY_FILE" >&2
  exit 1
fi

SSH_BASE=(
  ssh
  -i "$OPUS_EC2_IDENTITY_FILE"
  -o IdentitiesOnly=yes
  -o StrictHostKeyChecking=accept-new
)

if [[ "$#" -eq 0 ]]; then
  exec "${SSH_BASE[@]}" -t "${OPUS_EC2_USER}@${OPUS_EC2_HOST}" 'cd ~/opus-dev 2>/dev/null || cd "$HOME"; exec "$SHELL" -l'
else
  exec "${SSH_BASE[@]}" "${OPUS_EC2_USER}@${OPUS_EC2_HOST}" "$@"
fi
