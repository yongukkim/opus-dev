#!/usr/bin/env bash
# Web stability smoke checks for OPUS production operations.
set -u

APP_DIR="${APP_DIR:-$HOME/opus-dev}"
COMPOSE_FILE="${COMPOSE_FILE:-compose.web.yaml}"
BASE_URL="${BASE_URL:-https://app.opus-store.com}"
PATHS=("/" "/ko" "/ja")

FAILS=0
WARNS=0

log() { printf '[ops-web-check] %s\n' "$*"; }
ok() { printf '[OK] %s\n' "$*"; }
warn() { printf '[WARN] %s\n' "$*"; WARNS=$((WARNS + 1)); }
fail() { printf '[FAIL] %s\n' "$*"; FAILS=$((FAILS + 1)); }

dc() {
  if docker info >/dev/null 2>&1; then
    docker compose "$@"
  else
    sudo docker compose "$@"
  fi
}

run_http_checks() {
  log "HTTP status checks: ${BASE_URL} (/, /ko, /ja)"
  for p in "${PATHS[@]}"; do
    code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 8 "${BASE_URL}${p}" || true)"
    if [[ "$code" =~ ^[23][0-9][0-9]$ ]]; then
      ok "${p} -> HTTP ${code}"
    else
      fail "${p} -> HTTP ${code:-n/a}"
    fi
  done
}

run_container_checks() {
  if [[ ! -d "$APP_DIR" || ! -f "$APP_DIR/$COMPOSE_FILE" ]]; then
    warn "skip container checks (APP_DIR/compose missing): $APP_DIR/$COMPOSE_FILE"
    return
  fi

  log "Container status checks"
  cd "$APP_DIR" || return
  ps_out="$(dc -f "$COMPOSE_FILE" ps 2>/dev/null || true)"
  if [[ -z "$ps_out" ]]; then
    fail "docker compose ps returned empty output"
    return
  fi
  printf '%s\n' "$ps_out"

  if printf '%s\n' "$ps_out" | grep -q "opus-web" && printf '%s\n' "$ps_out" | grep -q "healthy"; then
    ok "opus-web health is reported as healthy"
  else
    fail "opus-web is not healthy"
  fi
}

run_backup_checks() {
  log "Backup artifact checks"
  latest="$(sudo bash -lc 'ls -1t /var/backups/opus-storage/opus-storage-*.tgz 2>/dev/null | head -n 1' || true)"
  if [[ -z "$latest" ]]; then
    fail "no backup archive found in /var/backups/opus-storage"
    return
  fi
  ok "latest backup: $latest"
  sudo ls -lh "$latest" || true
}

run_storage_checks() {
  if [[ ! -d "$APP_DIR" || ! -f "$APP_DIR/$COMPOSE_FILE" ]]; then
    warn "skip storage checks (APP_DIR/compose missing): $APP_DIR/$COMPOSE_FILE"
    return
  fi

  cd "$APP_DIR" || return
  cid="$(dc -f "$COMPOSE_FILE" ps -q opus-web 2>/dev/null || true)"
  if [[ -z "$cid" ]]; then
    fail "opus-web container id not found"
    return
  fi

  src="$(docker inspect "$cid" --format '{{range .Mounts}}{{if eq .Destination "/app/storage"}}{{.Source}}{{end}}{{end}}' 2>/dev/null || true)"
  if [[ -z "$src" ]]; then
    fail "could not resolve /app/storage source mount"
    return
  fi
  ok "storage source: $src"

  submissions="$src/submissions.jsonl"
  ownership="$src/ownership-events.jsonl"
  if ! sudo test -f "$submissions"; then
    fail "missing submissions file: $submissions"
    return
  fi
  if ! sudo test -f "$ownership"; then
    warn "missing ownership file: $ownership"
  fi

  sudo python3 - "$submissions" "$ownership" <<'PY'
import json
import sys
from collections import Counter
submissions_path, ownership_path = sys.argv[1], sys.argv[2]

def read_jsonl(path):
    rows = []
    try:
        with open(path, "r", encoding="utf-8") as f:
            for i, line in enumerate(f, 1):
                line = line.strip()
                if not line:
                    continue
                try:
                    rows.append(json.loads(line))
                except Exception as exc:
                    print(f"[FAIL] invalid json at {path}:{i} -> {exc}")
                    sys.exit(2)
    except FileNotFoundError:
        print(f"[WARN] file not found: {path}")
        return []
    return rows

subs = read_jsonl(submissions_path)
owns = read_jsonl(ownership_path)
status = Counter((x.get("reviewStatus") or "pending_review") for x in subs)
print(f"[OK] submissions rows: {len(subs)}")
for k in sorted(status):
    print(f"[OK] submissions reviewStatus {k}: {status[k]}")
print(f"[OK] ownership rows: {len(owns)}")
PY
  py_ec=$?
  if [[ $py_ec -ne 0 ]]; then
    fail "jsonl parsing failed"
  else
    ok "jsonl parsing and counters passed"
  fi
}

run_http_checks
run_container_checks
run_backup_checks
run_storage_checks

printf '\n[ops-web-check] done: fails=%d warns=%d\n' "$FAILS" "$WARNS"
if [[ "$FAILS" -gt 0 ]]; then
  exit 1
fi
