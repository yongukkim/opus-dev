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

# ISO 27001 A.13.1.3 / A.12.4.1 (CLAUDE.md §5, §6):
#   KO: 호스트·repo .env 의 COMPOSE_FILE 병합으로 의도하지 않은 스택이 올라가지 않도록 compose 호출 시 제거한다.
#   JA: ホストや repo .env の COMPOSE_FILE マージで意図しないスタックが起動しないよう、compose 呼び出し時に除去する。
#   EN: Strip COMPOSE_FILE when invoking compose so merged stacks from host/repo .env cannot start unintentionally.
dc() {
  if docker info >/dev/null 2>&1; then
    env -u COMPOSE_FILE docker compose "$@"
  else
    sudo env -u COMPOSE_FILE docker compose "$@"
  fi
}

run_http_checks() {
  # ISO 27001 A.13.1.3 (CLAUDE.md §6):
  #   KO: Caddy 재기동 직후 ACME/TLS 준비 전에 배포가 실패하지 않도록 HTTPS 응답을 재시도한다.
  #   JA: Caddy 再起動直後の ACME/TLS 準備前にデプロイが失敗しないよう、HTTPS 応答を再試行する。
  #   EN: Retry HTTPS after Caddy/ACME cold start so post-deploy checks do not false-fail.
  local max_attempts="${OPUS_HTTPS_HEALTH_RETRIES:-18}"
  local sleep_s="${OPUS_HTTPS_HEALTH_SLEEP:-5}"
  log "HTTP status checks: ${BASE_URL} (/, /ko, /ja) retries=${max_attempts}x${sleep_s}s"
  for p in "${PATHS[@]}"; do
    local code="" attempt=1
    while [[ $attempt -le $max_attempts ]]; do
      code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 12 "${BASE_URL}${p}" 2>/dev/null || true)"
      if [[ "$code" =~ ^[23][0-9][0-9]$ ]]; then
        ok "${p} -> HTTP ${code}"
        break
      fi
      if [[ $attempt -lt $max_attempts ]]; then
        log "wait HTTPS ${p} attempt ${attempt}/${max_attempts} (code=${code:-n/a})"
        sleep "$sleep_s"
      fi
      attempt=$((attempt + 1))
    done
    if [[ ! "$code" =~ ^[23][0-9][0-9]$ ]]; then
      fail "${p} -> HTTP ${code:-n/a} after ${max_attempts} attempts"
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
  # ISO 27001 A.12.3.1 (CLAUDE.md §5):
  #   KO: 인스턴스 교체 직후 첫 사이클에는 백업 아카이브가 없을 수 있어 기본은 경고만 한다.
  #   JA: インスタンス交換直後の初回サイクルではバックアップが無い場合があるため、既定は警告のみとする。
  #   EN: After instance replacement the first cycle may have no tarball; default is warn, not fail.
  log "Backup artifact checks"
  latest="$(sudo bash -lc 'ls -1t /var/backups/opus-storage/opus-storage-*.tgz 2>/dev/null | head -n 1' || true)"
  if [[ -z "$latest" ]]; then
    if [[ "${OPUS_STRICT_BACKUP_CHECK:-0}" == "1" ]]; then
      fail "no backup archive found in /var/backups/opus-storage"
    else
      warn "no backup archive yet (cold host / first cycle); OPUS_STRICT_BACKUP_CHECK=1 to fail here"
    fi
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
    warn "missing submissions file (empty volume / not restored): $submissions — skipping jsonl checks"
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

run_mail_config_checks() {
  if [[ ! -d "$APP_DIR" || ! -f "$APP_DIR/$COMPOSE_FILE" ]]; then
    warn "skip mail config checks (APP_DIR/compose missing): $APP_DIR/$COMPOSE_FILE"
    return
  fi

  cd "$APP_DIR" || return
  cid="$(dc -f "$COMPOSE_FILE" ps -q opus-web 2>/dev/null || true)"
  if [[ -z "$cid" ]]; then
    warn "skip mail config checks (opus-web container id not found)"
    return
  fi

  log "Storefront mail env checks (names only, no secrets)"
  mail_env="$(
    docker inspect "$cid" --format '{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null \
      | grep -E '^(OPUS_WEB_RESEND_API_KEY|RESEND_API_KEY|OPUS_WEB_SMTP_URL|OPUS_WEB_MAIL_FROM|OPUS_WEB_PUBLIC_ORIGIN)=' \
      | cut -d= -f1 \
      | sort -u \
      | tr '\n' ' ' \
      || true
  )"
  has_from=0 has_delivery=0
  docker inspect "$cid" --format '{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null \
    | grep -qE '^OPUS_WEB_MAIL_FROM=.+' && has_from=1 || true
  docker inspect "$cid" --format '{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null \
    | grep -qE '^(OPUS_WEB_RESEND_API_KEY|RESEND_API_KEY|OPUS_WEB_SMTP_URL)=.+' && has_delivery=1 || true

  if [[ $has_from -eq 1 && $has_delivery -eq 1 ]]; then
    ok "storefront mail env present (${mail_env})"
  else
    fail "storefront mail not configured — add OPUS_WEB_RESEND_API_KEY (or OPUS_WEB_SMTP_URL) + OPUS_WEB_MAIL_FROM to /etc/opus/opus.env and recreate opus-web"
  fi
}

run_exposure_boundary_checks() {
  if [[ ! -d "$APP_DIR" || ! -f "$APP_DIR/$COMPOSE_FILE" ]]; then
    warn "skip exposure boundary checks (APP_DIR/compose missing): $APP_DIR/$COMPOSE_FILE"
    return
  fi

  cd "$APP_DIR" || return
  cid="$(dc -f "$COMPOSE_FILE" ps -q opus-web 2>/dev/null || true)"
  if [[ -z "$cid" ]]; then
    warn "skip exposure boundary checks (opus-web container id not found)"
    return
  fi
  src="$(docker inspect "$cid" --format '{{range .Mounts}}{{if eq .Destination "/app/storage"}}{{.Source}}{{end}}{{end}}' 2>/dev/null || true)"
  if [[ -z "$src" ]]; then
    warn "skip exposure boundary checks (could not resolve /app/storage source mount)"
    return
  fi
  submissions="$src/submissions.jsonl"
  if ! sudo test -f "$submissions"; then
    warn "skip exposure boundary checks (missing submissions file: $submissions)"
    return
  fi

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
    warn "skip exposure boundary checks (no approved submission)"
    return
  fi

  log "Exposure boundary checks (web route must not return raw original)"
  code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 8 "${BASE_URL}/api/artwork-submissions/${approved_id}/download" || true)"
  if [[ "$code" =~ ^[23][0-9][0-9]$ ]]; then
    fail "raw download endpoint is publicly reachable for approved submission: HTTP ${code}"
  else
    ok "raw download endpoint blocked for anonymous web request: HTTP ${code:-n/a}"
  fi
}

run_http_checks
run_container_checks
run_mail_config_checks
run_backup_checks
run_storage_checks
run_exposure_boundary_checks

printf '\n[ops-web-check] done: fails=%d warns=%d\n' "$FAILS" "$WARNS"
if [[ "$FAILS" -gt 0 ]]; then
  exit 1
fi
