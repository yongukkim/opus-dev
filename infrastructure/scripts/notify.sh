#!/usr/bin/env bash
# OPUS — post a message to Slack Incoming Webhook (URL only in apps/web/.env; do not commit secrets).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_FILE="${OPUS_WEB_ENV_FILE:-$REPO_ROOT/apps/web/.env}"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

if [[ -z "${SLACK_WEBHOOK_URL:-}" ]]; then
  echo "notify.sh: SLACK_WEBHOOK_URL is not set (add to apps/web/.env)" >&2
  exit 1
fi

curl -sS -f -X POST -H "Content-type: application/json" \
  -d '{"text":"OPUS: 차콜 & 골드 엔진 가동 완료! 🚀"}' \
  "$SLACK_WEBHOOK_URL" >/dev/null

echo "notify.sh: Slack notification sent."
