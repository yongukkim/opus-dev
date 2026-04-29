#!/usr/bin/env bash
# Migrate legacy private/* storedFile paths to private/master/* with append-only JSONL patches.
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/opus-dev}"
COMPOSE_FILE="${COMPOSE_FILE:-compose.web.yaml}"
MODE="dry-run"

for arg in "$@"; do
  case "$arg" in
    --apply) MODE="apply" ;;
    --dry-run) MODE="dry-run" ;;
    *)
      printf 'usage: %s [--dry-run|--apply]\n' "$0" >&2
      exit 1
      ;;
  esac
done

log() { printf '[ops-master-migrate] %s\n' "$*"; }
ok() { printf '[OK] %s\n' "$*"; }
warn() { printf '[WARN] %s\n' "$*"; }
fail() { printf '[FAIL] %s\n' "$*"; exit 1; }

dc() {
  if docker info >/dev/null 2>&1; then
    docker compose "$@"
  else
    sudo docker compose "$@"
  fi
}

if [[ ! -d "$APP_DIR" || ! -f "$APP_DIR/$COMPOSE_FILE" ]]; then
  fail "APP_DIR/compose not found: $APP_DIR/$COMPOSE_FILE"
fi

cd "$APP_DIR"
cid="$(dc -f "$COMPOSE_FILE" ps -q opus-web 2>/dev/null || true)"
if [[ -z "$cid" ]]; then
  fail "opus-web container id not found"
fi
src="$(docker inspect "$cid" --format '{{range .Mounts}}{{if eq .Destination "/app/storage"}}{{.Source}}{{end}}{{end}}' 2>/dev/null || true)"
if [[ -z "$src" ]]; then
  fail "could not resolve /app/storage source mount"
fi
ok "storage source: $src"

submissions="$src/submissions.jsonl"
if ! sudo test -f "$submissions"; then
  fail "missing submissions file: $submissions"
fi

if [[ "$MODE" == "apply" ]]; then
  if [[ -x "$APP_DIR/scripts/backup-opus-storage.sh" ]]; then
    log "Taking backup before migration"
    APP_DIR="$APP_DIR" COMPOSE_FILE="$COMPOSE_FILE" "$APP_DIR/scripts/backup-opus-storage.sh"
  else
    warn "backup-opus-storage.sh not found/executable; continuing without backup"
  fi
fi

tmp_py="$(mktemp)"
cat >"$tmp_py" <<'PY'
import json
import os
import shutil
import sys
from datetime import datetime, timezone

submissions_path, storage_root, mode = sys.argv[1], sys.argv[2], sys.argv[3]
is_apply = mode == "apply"

with open(submissions_path, "r", encoding="utf-8") as f:
    rows = [ln.strip() for ln in f if ln.strip()]

parsed = []
for ln in rows:
    try:
        parsed.append(json.loads(ln))
    except Exception:
        continue

latest = {}
for rec in parsed:
    sid = (rec.get("id") or "").strip()
    if sid:
        latest[sid] = rec

patches = []
stats = {"total": len(latest), "legacy": 0, "migrate": 0, "skip": 0, "error": 0}

for sid, rec in latest.items():
    sf = rec.get("storedFile") or {}
    rel = (sf.get("relativePath") or "").strip()
    if not rel:
        stats["error"] += 1
        print(f"[WARN] id={sid} invalid relativePath")
        continue
    if rel.startswith("private/master/"):
        continue
    if not rel.startswith("private/"):
        stats["error"] += 1
        print(f"[WARN] id={sid} outside private root: {rel}")
        continue

    stats["legacy"] += 1
    new_rel = f"private/master/{rel[len('private/'):]}"
    old_abs = os.path.normpath(os.path.join(storage_root, rel))
    new_abs = os.path.normpath(os.path.join(storage_root, new_rel))
    root_abs = os.path.normpath(storage_root)
    if not old_abs.startswith(root_abs + os.sep) or not new_abs.startswith(root_abs + os.sep):
        stats["error"] += 1
        print(f"[WARN] id={sid} path traversal detected")
        continue
    if not os.path.exists(old_abs):
        stats["error"] += 1
        print(f"[WARN] id={sid} source missing: {rel}")
        continue
    if os.path.exists(new_abs):
        stats["skip"] += 1
        print(f"[WARN] id={sid} destination exists, skipping move: {new_rel}")
        continue

    stats["migrate"] += 1
    print(f"[PLAN] id={sid}")
    print(f"[PLAN]  from={rel}")
    print(f"[PLAN]  to  ={new_rel}")
    if is_apply:
      os.makedirs(os.path.dirname(new_abs), exist_ok=True)
      shutil.move(old_abs, new_abs)
      patch = dict(rec)
      patch["storedFile"] = dict(sf)
      patch["storedFile"]["relativePath"] = new_rel
      patch["createdAt"] = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
      patches.append(patch)

if is_apply and patches:
    with open(submissions_path, "a", encoding="utf-8") as out:
        for p in patches:
            out.write(json.dumps(p, ensure_ascii=False) + "\n")
    print(f"[OK] appended patch rows: {len(patches)}")
elif is_apply:
    print("[OK] no patch rows appended")

print(f"[OK] latest submissions: {stats['total']}")
print(f"[OK] legacy paths: {stats['legacy']}")
print(f"[OK] planned migrations: {stats['migrate']}")
print(f"[OK] skipped(existing destination): {stats['skip']}")
print(f"[OK] errors: {stats['error']}")

if stats["error"] > 0 and is_apply:
    sys.exit(2)
PY

log "Mode: $MODE"
sudo python3 "$tmp_py" "$submissions" "$src" "$MODE"
ec=$?
rm -f "$tmp_py"
if [[ $ec -ne 0 ]]; then
  fail "migration run failed (exit=$ec)"
fi

if [[ "$MODE" == "apply" ]]; then
  if [[ -x "$APP_DIR/scripts/ec2-chown-web-storage.sh" ]]; then
    APP_DIR="$APP_DIR" COMPOSE_FILE="$COMPOSE_FILE" bash "$APP_DIR/scripts/ec2-chown-web-storage.sh"
  fi
  ok "apply completed"
else
  ok "dry-run completed (no changes)"
fi
