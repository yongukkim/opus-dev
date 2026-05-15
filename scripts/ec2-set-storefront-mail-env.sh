#!/usr/bin/env bash
# Append or update storefront mail env on the web EC2 host (/etc/opus/opus.env).
# Values are never printed. Requires Resend API key or SMTP URL + verified MAIL_FROM.
#
# Usage (Resend — recommended):
#   OPUS_WEB_RESEND_API_KEY=re_... \
#   OPUS_WEB_MAIL_FROM='OPUS <noreply@opus-store.com>' \
#   bash scripts/ec2-set-storefront-mail-env.sh
#
# Usage (SMTP):
#   OPUS_WEB_SMTP_URL='smtps://user:pass@smtp.example.com:465' \
#   OPUS_WEB_MAIL_FROM='OPUS <noreply@opus-store.com>' \
#   bash scripts/ec2-set-storefront-mail-env.sh
#
# ISO 27001 A.9.4.1 / A.10.1.1 (CLAUDE.md §3):
#   KO: 메일 비밀은 리포/이미지에 넣지 않고 EC2 호스트 env 파일로만 주입한다.
#   JA: メール資格情報はリポ/イメージに入れず、EC2ホストの env ファイルのみに注入する。
#   EN: Mail credentials live only in the EC2 host env file, never in repo or images.
set -euo pipefail

SSH_KEY="${SSH_KEY:-$HOME/.ssh/opus_ci_deploy}"
EC2_USER="${EC2_USER:-ubuntu}"
ENV_PATH="${ENV_PATH:-/etc/opus/opus.env}"
TF_DIR="${TF_DIR:-$(cd "$(dirname "$0")/.." && pwd)/infra/terraform}"
SSH_OPTS="${SSH_OPTS:--o BatchMode=yes -o StrictHostKeyChecking=accept-new}"
RESTART_WEB="${RESTART_WEB:-1}"

EC2_HOST="${EC2_HOST:-$(cd "$TF_DIR" && terraform output -raw instance_public_ip)}"

RESEND_KEY="${OPUS_WEB_RESEND_API_KEY:-${RESEND_API_KEY:-}}"
SMTP_URL="${OPUS_WEB_SMTP_URL:-}"
MAIL_FROM="${OPUS_WEB_MAIL_FROM:-}"
PUBLIC_ORIGIN="${OPUS_WEB_PUBLIC_ORIGIN:-https://app.opus-store.com}"

if [[ -z "$MAIL_FROM" ]]; then
  echo "ERROR: OPUS_WEB_MAIL_FROM is required (e.g. 'OPUS <noreply@opus-store.com>')." >&2
  exit 1
fi
if [[ -z "$RESEND_KEY" && -z "$SMTP_URL" ]]; then
  echo "ERROR: set OPUS_WEB_RESEND_API_KEY (or RESEND_API_KEY) or OPUS_WEB_SMTP_URL." >&2
  exit 1
fi
if [[ -n "$RESEND_KEY" && -n "$SMTP_URL" ]]; then
  echo "ERROR: set only one delivery path (Resend or SMTP), not both." >&2
  exit 1
fi

upsert_line() {
  local key="$1"
  local value="$2"
  printf '%s=%q\n' "$key" "$value"
}

echo "==> EC2 ${EC2_USER}@${EC2_HOST} — upsert mail keys in ${ENV_PATH}"

BLOCK="$(mktemp)"
trap 'rm -f "$BLOCK"' EXIT

{
  upsert_line "OPUS_WEB_MAIL_FROM" "$MAIL_FROM"
  upsert_line "OPUS_WEB_PUBLIC_ORIGIN" "$PUBLIC_ORIGIN"
  if [[ -n "$RESEND_KEY" ]]; then
    upsert_line "OPUS_WEB_RESEND_API_KEY" "$RESEND_KEY"
  else
    upsert_line "OPUS_WEB_SMTP_URL" "$SMTP_URL"
  fi
} >"$BLOCK"

ssh -i "$SSH_KEY" $SSH_OPTS "${EC2_USER}@${EC2_HOST}" \
  "sudo install -d -m 0750 -o root -g ${EC2_USER} /etc/opus && \
   sudo touch ${ENV_PATH} && sudo chown root:${EC2_USER} ${ENV_PATH} && sudo chmod 0640 ${ENV_PATH}"

scp -i "$SSH_KEY" $SSH_OPTS "$BLOCK" "${EC2_USER}@${EC2_HOST}:/tmp/opus-mail-upsert.env" >/dev/null

ssh -i "$SSH_KEY" $SSH_OPTS "${EC2_USER}@${EC2_HOST}" bash -s -- "$ENV_PATH" <<'REMOTE'
set -euo pipefail
ENV_PATH="$1"
UPSERT="/tmp/opus-mail-upsert.env"
BASE="$(mktemp)"
OUT="$(mktemp)"

sudo test -f "$ENV_PATH" && sudo cat "$ENV_PATH" >"$BASE" || true

# Remove keys we are replacing (and stale alternates).
grep -v -E '^(OPUS_WEB_RESEND_API_KEY|RESEND_API_KEY|OPUS_WEB_SMTP_URL|OPUS_WEB_MAIL_FROM|OPUS_WEB_PUBLIC_ORIGIN)=' "$BASE" >"$OUT" || true
cat "$UPSERT" >>"$OUT"
sudo install -m 0640 -o root -g ubuntu "$OUT" "$ENV_PATH"
rm -f "$BASE" "$OUT" "$UPSERT"
echo "==> keys present (names only):"
sudo grep -E '^[A-Z_][A-Z0-9_]*=' "$ENV_PATH" | cut -d= -f1 | sort
REMOTE

if [[ "$RESTART_WEB" == "1" ]]; then
  echo "==> restarting opus-web container"
  ssh -i "$SSH_KEY" $SSH_OPTS "${EC2_USER}@${EC2_HOST}" \
    'cd "$HOME/opus-dev" && docker compose -f compose.web.yaml up -d --force-recreate opus-web && docker compose -f compose.web.yaml ps opus-web'
fi

echo "==> done. Test signup on https://app.opus-store.com/ko/signup"
