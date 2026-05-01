# OPUS Backup & Restore Policy (Draft)

This document defines the operational backup policy for OPUS web/storage and database recovery readiness.

## 1) Scope

- **Storage backup target:** Docker-mounted OPUS storage path (`/app/storage` mount source)
- **Database backup target:** RDS PostgreSQL automated backups and snapshots
- **Out of scope:** Local developer workstation temporary files

## 2) Current Mechanisms

- **Storage backup script:** `scripts/backup-opus-storage.sh`
- **Storage restore script:** `scripts/restore-opus-storage.sh`
- **DB infra baseline:** `infra/terraform/rds.tf` (`backup_retention_period` and RDS lifecycle options)
- **Operations checklist:** `docs/redundancy-phase1-checklist.md`

## 3) Backup Frequency & Retention

- **Storage backup cadence:** Daily (cron or scheduler on production host)
- **Storage retention:** Keep at least 14 days (default `KEEP_DAYS=14` in script)
- **DB retention baseline:** Follow RDS automated backup retention configured by Terraform/environment
- **Manual snapshot rule:** Take a manual DB snapshot before high-risk migration or schema rollout

## 4) Recovery Objectives (Operational Targets)

- **RPO target (storage):** <= 24 hours
- **RTO target (storage service):** <= 2 hours for single-host incident
- **RPO/RTO target (DB):** Defined per environment based on RDS retention/window and release criticality

These are operating targets and must be reviewed when architecture or traffic profile changes.

## 5) Restore Procedure (Storage)

1. Confirm incident scope and select backup tarball
2. Stop service through compose
3. Restore tarball to validated mount source path
4. Re-apply expected ownership (`uid:gid`)
5. Restart service and run smoke checks

Use the canonical script:

- `scripts/restore-opus-storage.sh /path/to/opus-storage-*.tgz`

## 6) Verification & Drills

- Run **weekly restore rehearsal** in non-production path/host
- Verify integrity for submissions/ownership event chains after restore
- Record:
  - backup file timestamp and size
  - restore elapsed time
  - verification outcome
  - incident ticket/runbook reference

## 7) Change Management

- Any change to backup schedule, retention, or restore steps must update:
  - this policy document
  - relevant script defaults
  - redundancy checklist
- Keep policy in repo to support audit/due-diligence traceability.

## 8) Security & Compliance Notes

- Backup artifacts may include sensitive operational data; enforce least-privilege file access
- Do not embed secrets in scripts; use environment/secret manager references
- Align implementation with `SECURITY_GOVERNANCE.md` and ISO 27001 control mapping used in code comments
