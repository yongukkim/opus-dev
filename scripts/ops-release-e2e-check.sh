#!/usr/bin/env bash
# Read-only E2E check for release visibility:
# approved submission -> releases index -> release detail -> public preview.
set -u

APP_DIR="${APP_DIR:-$HOME/opus-dev}"
COMPOSE_FILE="${COMPOSE_FILE:-compose.web.yaml}"
BASE_URL="${BASE_URL:-https://app.opus-store.com}"

FAILS=0
WARNS=0

log() { printf '[ops-release-e2e] %s\n' "$*"; }
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

check_http_code() {
  local url="$1"
  local label="$2"
  local code
  code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 10 "$url" || true)"
  if [[ "$code" =~ ^[23][0-9][0-9]$ ]]; then
    ok "${label}: HTTP ${code}"
    return 0
  fi
  fail "${label}: HTTP ${code:-n/a}"
  return 1
}

if [[ ! -d "$APP_DIR" || ! -f "$APP_DIR/$COMPOSE_FILE" ]]; then
  fail "APP_DIR/compose not found: $APP_DIR/$COMPOSE_FILE"
  exit 1
fi

cd "$APP_DIR" || exit 1
cid="$(dc -f "$COMPOSE_FILE" ps -q opus-web 2>/dev/null || true)"
if [[ -z "$cid" ]]; then
  fail "opus-web container id not found"
  exit 1
fi

src="$(docker inspect "$cid" --format '{{range .Mounts}}{{if eq .Destination "/app/storage"}}{{.Source}}{{end}}{{end}}' 2>/dev/null || true)"
if [[ -z "$src" ]]; then
  fail "could not resolve /app/storage source mount"
  exit 1
fi
submissions="$src/submissions.jsonl"
if ! sudo test -f "$submissions"; then
  fail "missing submissions file: $submissions"
  exit 1
fi

log "Locate newest approved submission id"
approved_id="$(
  sudo python3 - "$submissions" <<'PY'
import json
import sys
path = sys.argv[1]
latest = None
with open(path, "r", encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if not line:
            continue
        try:
            row = json.loads(line)
        except Exception:
            continue
        if (row.get("reviewStatus") or "pending_review") != "approved":
            continue
        if not row.get("id"):
            continue
        if latest is None or row.get("createdAt", "") > latest.get("createdAt", ""):
            latest = row
if latest:
    print(latest["id"])
PY
)"

if [[ -z "$approved_id" ]]; then
  warn "no approved submissions found; cannot verify release exposure"
  printf '\n[ops-release-e2e] done: fails=%d warns=%d\n' "$FAILS" "$WARNS"
  exit 0
fi
ok "approved submission id: $approved_id"

check_http_code "${BASE_URL}/ko/releases" "KO releases index"
check_http_code "${BASE_URL}/ja/releases" "JA releases index"
check_http_code "${BASE_URL}/en/releases" "EN releases index"
check_http_code "${BASE_URL}/ko/releases/submission/${approved_id}" "KO release detail"
check_http_code "${BASE_URL}/api/artwork-submissions/${approved_id}/public-preview" "Public preview"

log "Verify releases index references the approved submission"
if curl -sS --max-time 10 "${BASE_URL}/ko/releases" | python3 -c 'import sys; html=sys.stdin.read(); needle=sys.argv[1]; sys.exit(0 if needle in html else 1)' "$approved_id"; then
  ok "KO releases page contains submission id link"
else
  fail "KO releases page does not include approved submission id"
fi

printf '\n[ops-release-e2e] done: fails=%d warns=%d\n' "$FAILS" "$WARNS"
if [[ "$FAILS" -gt 0 ]]; then
  exit 1
fi
