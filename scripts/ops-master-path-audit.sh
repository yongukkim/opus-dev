#!/usr/bin/env bash
# Read-only audit for storedFile.relativePath migration coverage.
set -u

APP_DIR="${APP_DIR:-$HOME/opus-dev}"
COMPOSE_FILE="${COMPOSE_FILE:-compose.web.yaml}"

FAILS=0
WARNS=0

log() { printf '[ops-master-audit] %s\n' "$*"; }
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
ok "storage source: $src"

submissions="$src/submissions.jsonl"
if ! sudo test -f "$submissions"; then
  fail "missing submissions file: $submissions"
  exit 1
fi

log "Audit storedFile.relativePath coverage (latest row per submission id)"
sudo python3 - "$submissions" "$src" <<'PY'
import json
import os
import sys

submissions_path, storage_root = sys.argv[1], sys.argv[2]

latest = {}
with open(submissions_path, "r", encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if not line:
            continue
        try:
            row = json.loads(line)
        except Exception:
            continue
        sid = (row.get("id") or "").strip()
        if sid:
            latest[sid] = row

total = len(latest)
master = 0
legacy = 0
missing = 0
invalid = 0
samples = []

for sid, row in latest.items():
    rel = ((row.get("storedFile") or {}).get("relativePath") or "").strip()
    if not rel:
        invalid += 1
        if len(samples) < 10:
            samples.append((sid, rel, "invalid_relative_path"))
        continue
    if rel.startswith("private/master/"):
        master += 1
    elif rel.startswith("private/"):
        legacy += 1
    else:
        invalid += 1
        if len(samples) < 10:
            samples.append((sid, rel, "outside_private_root"))
        continue

    abs_path = os.path.normpath(os.path.join(storage_root, rel))
    if not abs_path.startswith(os.path.normpath(storage_root) + os.sep):
        invalid += 1
        if len(samples) < 10:
            samples.append((sid, rel, "path_traversal"))
        continue
    if not os.path.exists(abs_path):
        missing += 1
        if len(samples) < 10:
            samples.append((sid, rel, "file_missing"))

print(f"[OK] submissions(latest): {total}")
print(f"[OK] private/master paths: {master}")
print(f"[OK] legacy private/* paths: {legacy}")
print(f"[OK] missing files: {missing}")
print(f"[OK] invalid paths: {invalid}")
if samples:
    print("[WARN] sample issues (up to 10):")
    for sid, rel, reason in samples:
        print(f"[WARN]  - id={sid} reason={reason} path={rel}")
PY
py_ec=$?
if [[ $py_ec -ne 0 ]]; then
  fail "path audit script failed"
  printf '\n[ops-master-audit] done: fails=%d warns=%d\n' "$FAILS" "$WARNS"
  exit 1
fi

printf '\n[ops-master-audit] done: fails=%d warns=%d\n' "$FAILS" "$WARNS"
if [[ "$FAILS" -gt 0 ]]; then
  exit 1
fi
