# OPUS Web Stability Checklist

This checklist is for production web stabilization on `app.opus-store.com`.

## 1) Pre-deploy

- Confirm latest backup exists:
  - `sudo ls -1t /var/backups/opus-storage/opus-storage-*.tgz | head -n 1`
- Confirm cron is registered:
  - `sudo crontab -l | grep backup-opus-storage.sh`
- Confirm working tree and branch on server:
  - `cd ~/opus-dev && git status -sb`

## 2) Post-deploy smoke check

- Run web stability script:
  - `APP_DIR=/home/ubuntu/opus-dev /home/ubuntu/opus-dev/scripts/ops-web-stability-check.sh`
- HTTP checks must be 2xx/3xx for:
  - `/`
  - `/ko`
  - `/ja`
- `opus-web` container must be healthy in `docker compose ps`

## 3) Data integrity check

- Verify submissions/ownership JSONL parse and row counts:
  - included in `ops-web-stability-check.sh`
- If homepage looks empty, check review status counts:
  - approved items are required for public release surfaces
- Run release exposure E2E (read-only):
  - `APP_DIR=/home/ubuntu/opus-dev /home/ubuntu/opus-dev/scripts/ops-release-e2e-check.sh`

## 4) Incident quick actions

- If deploy fails before container restart:
  - inspect workflow deploy log in GitHub Actions
- If storage data is missing:
  - list backups: `sudo ls -lh /var/backups/opus-storage`
  - restore with:
    - `APP_DIR=/home/ubuntu/opus-dev /home/ubuntu/opus-dev/scripts/restore-opus-storage.sh <backup-file>`
- If app is up but unhealthy:
  - `cd ~/opus-dev && docker compose -f compose.web.yaml logs --tail=120 opus-web`

## 5) Weekly routine

- Verify at least one new backup archive exists for the week
- Copy backup archives to off-instance storage (recommended)
- Run one restore drill in staging or disposable host
