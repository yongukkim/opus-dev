import path from "node:path";

/**
 * ISO 27001 A.12.4.1 (§5) Secure logging & auditing — append-only store separation (demo JSONL era).
 *
 * KO: 아래 경로는 **책임을 섞지 않는다**. (1) `submissions.jsonl`은 제출·검수 스냅샷의 진실 원장, (2) `chronicle-entries.jsonl`은
 *     공개·감사용 발행 이력(마스킹 투영은 API에서만), (3) `onchain-mint-jobs.jsonl`은 온체인 실행·재시도 큐(가스·ABI 스냅샷),
 *     (4) `ownership-events.jsonl`은 소유권 이전 이벤트. 한 레이어의 실패가 다른 레이어의 확정을 덮어쓰지 않게 API에서 분기한다.
 * JA: 以下のパスは**責務を混在させない**。(1) submissions は提出・審査スナップショット、(2) chronicle は公開・監査向け発行履歴、
 *     (3) onchain-mint-jobs はオンチェーン実行・再試行キュー、(4) ownership-events は所有移転。失敗を他レイヤーの確定で上書きしない。
 * EN: Paths below are **single-responsibility append-only ledgers**: submissions (review truth), chronicle (public audit trail),
 *     onchain-mint-jobs (execution queue + retry + policy snapshots), ownership-events (custody). API routes keep failures isolated.
 *
 * 단계별 확장: Prisma `ChronicleEntry`/`Edition` 컷오버 시에도 동일 경계를 유지하고, 이 모듈의 상수만 교체·이전하면 된다.
 * Phased extension: keep the same boundaries when cutting over to Prisma; swap paths via this module only.
 *
 * 운영·동의·기기 등 **보조 append-only JSONL**은 `AUX_LEDGER_FILES`에 모은다(에디션 원장과 분리).
 * Operational append-only JSONL (device, RBAC audit, seller consent, provenance listings) lives in `AUX_LEDGER_FILES`, separate from edition ledgers.
 */
export const STORAGE_ROOT = path.join(process.cwd(), "storage");

/** Private blob root (not a JSONL ledger; binary paths under `storage/private/...`). */
export const PRIVATE_ROOT = path.join(STORAGE_ROOT, "private");

/**
 * ISO 27001 A.14.2.1 (§1) — path traversal guard for blobs recorded relative to `STORAGE_ROOT`.
 * KO: `submissions.jsonl` 등에 기록된 상대경로를 절대경로로 풀되, 저장소 루트 밖으로 이탈하는 입력은 거부합니다.
 * JA: 原簿に記録された相対パスを絶対パスへ解決するが、保存ルート外へ脱出する入力は拒否します。
 * EN: Resolve ledger-recorded relative paths under the storage root and reject traversal escapes.
 */
export function resolveStorageRelativeFile(relativePath: string): string {
  if (typeof relativePath !== "string") {
    throw new Error("invalid_storage_path");
  }
  const trimmed = relativePath.trim();
  if (!trimmed || trimmed === "." || path.isAbsolute(trimmed)) {
    throw new Error("invalid_storage_path");
  }
  const rootResolved = path.resolve(STORAGE_ROOT);
  const resolved = path.resolve(rootResolved, trimmed);
  if (resolved !== rootResolved && !resolved.startsWith(`${rootResolved}${path.sep}`)) {
    throw new Error("invalid_storage_path");
  }
  return resolved;
}

/** Core append-only JSONL ledgers — single import surface for paths + audit boundaries. */
export const LEDGER_FILES = {
  submissions: path.join(STORAGE_ROOT, "submissions.jsonl"),
  ownershipEvents: path.join(STORAGE_ROOT, "ownership-events.jsonl"),
  chronicleEntries: path.join(STORAGE_ROOT, "chronicle-entries.jsonl"),
  onchainMintJobs: path.join(STORAGE_ROOT, "onchain-mint-jobs.jsonl"),
} as const;

/**
 * ISO 27001 A.12.4.1 (§5) — auxiliary append-only logs (RBAC / consent / device / marketplace drafts).
 * KO: 코어 원장(`LEDGER_FILES`)과 혼동하지 않도록 별 객체로 둔다.
 * JA: コア原簿（LEDGER_FILES）と混同しないよう別オブジェクトに分離する。
 * EN: Keep separate from core ledgers (`LEDGER_FILES`) to avoid conflating audit domains.
 */
export const AUX_LEDGER_FILES = {
  deviceBindings: path.join(STORAGE_ROOT, "device-bindings.jsonl"),
  operatorRoleAudit: path.join(STORAGE_ROOT, "operator-role-audit.jsonl"),
  sellerVerifyConsent: path.join(STORAGE_ROOT, "seller-verify-consent.jsonl"),
  collectorTransferListings: path.join(STORAGE_ROOT, "collector-transfer-listings.jsonl"),
  mobileLeaseUses: path.join(STORAGE_ROOT, "mobile-lease-uses.jsonl"),
  artistPublicProfiles: path.join(STORAGE_ROOT, "artist-public-profiles.jsonl"),
  artistPayoutProfiles: path.join(STORAGE_ROOT, "artist-payout-profiles.jsonl"),
} as const;

/** Bounded exponential backoff for mint worker (operator-triggered or future cron). */
export const ONCHAIN_MINT_RETRY_POLICY = {
  maxAttempts: 5,
  baseDelayMs: 30_000,
  maxDelayMs: 30 * 60_000,
} as const;
