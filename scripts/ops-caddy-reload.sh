#!/usr/bin/env bash
# Run on EC2 from repo root (e.g. ~/opus-dev). Reloads Caddy config / restarts so TLS (Let's Encrypt) retries for new hostnames.
#
# ISO 27001 A.10.1.1 (§3) — TLS termination must follow the current published Caddyfile hostnames.
# KO: DNS 추가 후 console.* 인증서가 안 붙으면 이 스크립트로 ACME 재시도를 유도한다.
# JA: DNS追加後に console.* の証明書が付かない場合は本スクリプトでACME再試行を促す。
# EN: After DNS changes, if console TLS is missing, run this to nudge ACME / config reload.
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/opus-dev}"
cd "$APP_DIR"

cid="$(docker compose -f compose.web.yaml ps -q caddy 2>/dev/null || true)"
if [[ -z "$cid" ]]; then
  echo "ops-caddy-reload: no caddy container (is compose up?)" >&2
  exit 1
fi

if docker compose -f compose.web.yaml exec -T caddy caddy reload --config /etc/caddy/Caddyfile; then
  echo "ops-caddy-reload: caddy reload OK"
else
  echo "ops-caddy-reload: reload failed, restarting caddy" >&2
  docker compose -f compose.web.yaml restart caddy
  echo "ops-caddy-reload: caddy restart OK"
fi
