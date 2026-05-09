#!/usr/bin/env bash
# Run on EC2 from repo root (e.g. APP_DIR=~/opus-dev). Prints Caddyfile vs container + local TLS SNI + recent logs.
#
# ISO 27001 A.12.4.1 / A.13.1.3 (CLAUDE.md §5, §6) — Ops visibility without leaking secrets; hostnames only in output.
# KO: 엣지 TLS 문제 시 원인 분기(파일 미반영 vs ACME 실패)를 빠르게 하기 위한 읽기 전용 진단 출력이다.
# JA: エッジTLS不具合の切り分け（ファイル未反映 vs ACME失敗）のための読み取り専用診断出力である。
# EN: Read-only diagnostics to triangulate edge TLS issues (stale Caddyfile vs ACME failure).
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/opus-dev}"
cd "$APP_DIR"

echo "=== repo HEAD ==="
git rev-parse --short HEAD 2>/dev/null || echo "(not a git repo)"

web_caddy_q="$(docker compose -f compose.web.yaml ps -q caddy 2>/dev/null || true)"
con_caddy_q="$(docker compose -f compose.console.yaml ps -q caddy 2>/dev/null || true)"

if [[ -n "$web_caddy_q" ]]; then
  echo ""
  echo "=== APP STACK (compose.web.yaml) — host Caddyfile (names) ==="
  grep -E '^[[:alnum:]].*opus-store\.com' infra/caddy/Caddyfile || true
  echo "=== APP STACK — container Caddyfile (names) ==="
  docker compose -f compose.web.yaml exec -T caddy cat /etc/caddy/Caddyfile 2>/dev/null | grep -E '^[[:alnum:]].*opus-store\.com' || echo "(exec failed)"
  echo "=== openssl SNI app @ 127.0.0.1:443 ==="
  echo | openssl s_client -connect 127.0.0.1:443 -servername app.opus-store.com 2>&1 | grep -E 'subject=|issuer=|no peer|Verify return code' || true
  echo "=== docker ps (app: web + caddy) ==="
  docker compose -f compose.web.yaml ps opus-web caddy 2>/dev/null || docker compose -f compose.web.yaml ps
  echo "=== caddy logs app (last 50) ==="
  docker compose -f compose.web.yaml logs --tail=50 caddy 2>&1
fi

if [[ -n "$con_caddy_q" ]]; then
  echo ""
  echo "=== CONSOLE STACK (compose.console.yaml) — host Caddyfile (names) ==="
  grep -E '^[[:alnum:]].*opus-store\.com' infra/caddy/Caddyfile.console || true
  echo "=== CONSOLE STACK — container Caddyfile (names) ==="
  docker compose -f compose.console.yaml exec -T caddy cat /etc/caddy/Caddyfile 2>/dev/null | grep -E '^[[:alnum:]].*opus-store\.com' || echo "(exec failed)"
  echo "=== openssl SNI console @ 127.0.0.1:443 ==="
  echo | openssl s_client -connect 127.0.0.1:443 -servername console.opus-store.com 2>&1 | grep -E 'subject=|issuer=|no peer|Verify return code' || true
  echo "=== docker ps (console: opus-console + caddy) ==="
  docker compose -f compose.console.yaml ps opus-console caddy 2>/dev/null || docker compose -f compose.console.yaml ps
  echo "=== caddy logs console (last 50) ==="
  docker compose -f compose.console.yaml logs --tail=50 caddy 2>&1
fi

if [[ -z "$web_caddy_q" && -z "$con_caddy_q" ]]; then
  echo ""
  echo "=== no Caddy container found ==="
  echo "Neither compose.web.yaml nor compose.console.yaml has a running caddy service on this host."
fi
