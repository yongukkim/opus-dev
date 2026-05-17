import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { LEDGER_FILES, PRIVATE_ROOT, STORAGE_ROOT, resolveStorageRelativeFile } from "@/lib/ledgerStores";

export type OpusRole = "artist" | "operator" | "collector";

export type Actor = {
  userId: string;
  role: OpusRole;
};

export type SubmissionRecord = {
  id: string;
  createdAt: string;
  artistId: string;
  artistName: string;
  artistNameVisibility?: "public" | "private";
  nickname: string;
  artworkTitle: string;
  genre: string;
  /** Discovery / shelf grouping (optional for legacy rows). */
  audienceCategory?: "male" | "female" | "none";
  year?: number;
  description?: string;
  tags: string[];
  /** Moderation lifecycle: pending review → approved → (optional) changes requested / rejected. */
  reviewStatus?: "pending_review" | "approved" | "changes_requested" | "rejected" | "withdrawn";
  /** Content rating for discovery/purchase gating. Option B: explicit is rejected; mature is age-gated. */
  contentRating?: "general" | "mature" | "explicit";
  /** Operator note (e.g., reason for rejection or change request). */
  reviewNote?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  /** When the artist last acknowledged the current operator review note (ISO); compared to `reviewedAt`. */
  artistReviewNoticeAcknowledgedAt?: string;
  /** Artist withdrew the submission while still pending review (ISO). */
  artistWithdrawnAt?: string;
  editionMode: "unique" | "limited";
  editionTotal: number;
  initialMint: number;
  numberingPolicy: "auto" | "manual";
  lockEdition: boolean;
  /** List price in Japanese yen (integer). Optional for legacy submissions. */
  priceJpy?: number;
  storedFile: { relativePath: string; filename: string; mime: string; bytes: number };
};

export type OwnershipState = {
  submissionId: string;
  ownerType: "artist" | "collector";
  ownerId: string;
  updatedAt: string;
};

const SUBMISSIONS_FILE = LEDGER_FILES.submissions;
const OWNERSHIP_FILE = LEDGER_FILES.ownershipEvents;
const MASTER_ROOT = path.join(PRIVATE_ROOT, "master");

export function safeSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export function buildArtistWorkDir(artistId: string, submissionId: string): string {
  return path.join(MASTER_ROOT, "artists", artistId, "works", submissionId);
}

export function buildCollectorWorkDir(collectorId: string, submissionId: string): string {
  return path.join(MASTER_ROOT, "collectors", collectorId, "works", submissionId);
}

export function buildArtistCollectedWorkDir(artistId: string, submissionId: string): string {
  return path.join(MASTER_ROOT, "artists", artistId, "collected", submissionId);
}

export async function ensureStorage(): Promise<void> {
  await mkdir(MASTER_ROOT, { recursive: true });
}

export async function appendJsonl(filePath: string, obj: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(obj)}\n`, { flag: "a", encoding: "utf8" });
}

type SubmissionJsonlRow = SubmissionRecord & { title?: string };

/** Thrown when a submission ledger append would omit required identity fields. */
export class SubmissionLedgerValidationError extends Error {
  readonly code = "submission_ledger_invalid" as const;

  constructor(readonly missingFields: string[]) {
    super(`submission_ledger_invalid:${missingFields.join(",")}`);
    this.name = "SubmissionLedgerValidationError";
  }
}

/** Artist-entered title from one JSONL row (`artworkTitle`, legacy `title`). */
export function artistTitleFromSubmissionRow(row: SubmissionJsonlRow): string {
  const t = (typeof row.artworkTitle === "string" ? row.artworkTitle : row.title ?? "").trim();
  return t;
}

function pickFirstNonEmptyString(rows: SubmissionJsonlRow[], read: (r: SubmissionJsonlRow) => string | undefined): string {
  for (const r of rows) {
    const v = read(r)?.trim();
    if (v) return v;
  }
  return "";
}

function pickLastNonEmptyString(rows: SubmissionJsonlRow[], read: (r: SubmissionJsonlRow) => string | undefined): string {
  for (let i = rows.length - 1; i >= 0; i -= 1) {
    const v = read(rows[i]!)?.trim();
    if (v) return v;
  }
  return "";
}

/** First append with a title wins — artist registration input is immutable on the ledger. */
export function firstArtistArtworkTitleFromRows(rows: SubmissionJsonlRow[]): string {
  return pickFirstNonEmptyString(rows, (r) => artistTitleFromSubmissionRow(r) || undefined);
}

function pickStoredFile(rows: SubmissionJsonlRow[]): SubmissionRecord["storedFile"] {
  for (let i = rows.length - 1; i >= 0; i -= 1) {
    const sf = rows[i]!.storedFile;
    if (sf?.relativePath?.trim() && sf?.filename?.trim() && sf?.mime?.trim()) return sf;
  }
  return rows[rows.length - 1]!.storedFile;
}

/**
 * Merge append-only history: artist identity from the first registration row; lifecycle fields from the latest row.
 * KO: 작품명은 최초 등록 행만 유효하며 이후 append로 바뀌지 않습니다.
 * JA: 作品名は初回登録行のみ有効で、以降の append では変わりません。
 * EN: Artwork title is taken only from the first registration row and never overridden by later appends.
 */
export function mergeSubmissionRows(rows: SubmissionJsonlRow[]): SubmissionRecord {
  if (rows.length === 0) {
    throw new SubmissionLedgerValidationError(["id"]);
  }
  const latest = rows[rows.length - 1]!;
  const artworkTitle = firstArtistArtworkTitleFromRows(rows);
  const tags =
    Array.isArray(latest.tags) && latest.tags.length > 0
      ? latest.tags
      : rows.reduce<string[]>((acc, r) => (r.tags?.length ? r.tags : acc), []);

  return {
    ...latest,
    id: latest.id.trim(),
    createdAt: pickFirstNonEmptyString(rows, (r) => r.createdAt) || latest.createdAt,
    artistId: pickFirstNonEmptyString(rows, (r) => r.artistId) || latest.artistId,
    artistName: pickFirstNonEmptyString(rows, (r) => r.artistName) || latest.artistName,
    nickname: pickFirstNonEmptyString(rows, (r) => r.nickname) || latest.nickname,
    artworkTitle,
    genre: pickFirstNonEmptyString(rows, (r) => r.genre) || latest.genre,
    tags: tags.length > 0 ? tags : Array.isArray(latest.tags) ? latest.tags : [],
    storedFile: pickStoredFile(rows),
    editionMode: latest.editionMode === "limited" ? "limited" : "unique",
    editionTotal: Number.isFinite(latest.editionTotal) ? latest.editionTotal : 1,
    initialMint: Number.isFinite(latest.initialMint) ? latest.initialMint : 1,
    numberingPolicy: latest.numberingPolicy === "manual" ? "manual" : "auto",
    lockEdition: Boolean(latest.lockEdition),
  };
}

function collectMissingSubmissionFields(rec: SubmissionRecord): string[] {
  const missing: string[] = [];
  if (!rec.id?.trim()) missing.push("id");
  if (!rec.createdAt?.trim()) missing.push("createdAt");
  if (!rec.artistId?.trim()) missing.push("artistId");
  if (!rec.artistName?.trim()) missing.push("artistName");
  if (!rec.nickname?.trim()) missing.push("nickname");
  if (!rec.artworkTitle?.trim()) missing.push("artworkTitle");
  if (!rec.genre?.trim()) missing.push("genre");
  if (!Array.isArray(rec.tags)) missing.push("tags");
  if (!rec.storedFile?.relativePath?.trim()) missing.push("storedFile.relativePath");
  if (!rec.storedFile?.filename?.trim()) missing.push("storedFile.filename");
  if (!rec.storedFile?.mime?.trim()) missing.push("storedFile.mime");
  if (typeof rec.storedFile?.bytes !== "number" || rec.storedFile.bytes < 0) missing.push("storedFile.bytes");
  if (rec.editionMode !== "unique" && rec.editionMode !== "limited") missing.push("editionMode");
  if (!Number.isFinite(rec.editionTotal) || rec.editionTotal < 1) missing.push("editionTotal");
  if (!Number.isFinite(rec.initialMint) || rec.initialMint < 1) missing.push("initialMint");
  if (rec.numberingPolicy !== "auto" && rec.numberingPolicy !== "manual") missing.push("numberingPolicy");
  if (typeof rec.lockEdition !== "boolean") missing.push("lockEdition");
  return missing;
}

/** Canonical artist-entered title for a submission (first non-empty row in submissions.jsonl only). */
export async function getCanonicalArtistArtworkTitle(submissionId: string): Promise<string> {
  const id = submissionId.trim();
  if (!id) return "";
  const records = await readJsonl<SubmissionJsonlRow>(SUBMISSIONS_FILE);
  const history = records.filter((r) => r?.id === id);
  return firstArtistArtworkTitleFromRows(history);
}

/**
 * ISO 27001 A.14.2.1 (§1) / A.12.4.1 (§5)
 * KO: append 직전에 원장 이력·등록 제목을 병합하고 필수 식별 필드가 없으면 거부합니다.
 * JA: append 直前に原簿履歴・登録タイトルを統合し、必須識別フィールド欠落時は拒否します。
 * EN: Merge ledger history and registration title before append; reject when required identity fields are missing.
 */
export async function prepareSubmissionForLedgerAppend(rec: SubmissionJsonlRow): Promise<SubmissionRecord> {
  const id = rec.id?.trim();
  if (!id) throw new SubmissionLedgerValidationError(["id"]);

  const records = await readJsonl<SubmissionJsonlRow>(SUBMISSIONS_FILE);
  const history = records.filter((r) => r?.id === id);
  const priorMerged = history.length > 0 ? mergeSubmissionRows(history) : null;

  const rowTitle = artistTitleFromSubmissionRow(rec);
  const firstTitle = history.length > 0 ? firstArtistArtworkTitleFromRows(history) : "";
  /** New submission: incoming title required. Patches: always preserve first registration title. */
  const artworkTitle = history.length === 0 ? rowTitle : firstTitle;

  const merged: SubmissionRecord = priorMerged
    ? {
        ...priorMerged,
        ...rec,
        id,
        artworkTitle,
        nickname: rec.nickname?.trim() || priorMerged.nickname,
        artistName: rec.artistName?.trim() || priorMerged.artistName,
        genre: rec.genre?.trim() || priorMerged.genre,
        artistId: rec.artistId?.trim() || priorMerged.artistId,
        createdAt: rec.createdAt?.trim() || priorMerged.createdAt,
        storedFile:
          rec.storedFile?.relativePath?.trim() && rec.storedFile?.filename?.trim()
            ? rec.storedFile
            : priorMerged.storedFile,
        tags: Array.isArray(rec.tags) && rec.tags.length > 0 ? rec.tags : priorMerged.tags,
      }
    : {
        ...(rec as SubmissionRecord),
        id,
        artworkTitle,
        tags: Array.isArray(rec.tags) ? rec.tags : [],
      };

  const missing = collectMissingSubmissionFields(merged);
  if (missing.length > 0) throw new SubmissionLedgerValidationError(missing);
  return merged;
}

/**
 * ISO 27001 A.14.2.1 (§1) / A.12.4.1 (§5)
 * KO: 제출 원장에 완전한 식별 스냅샷만 append하며, 작품명 등 필수값 누락 시 기록하지 않습니다.
 * JA: 提出原簿には完全な識別スナップショットのみ追記し、作品名等の必須欠落時は書き込みません。
 * EN: Append only complete identity snapshots to the submissions ledger; refuse when required fields are absent.
 */
export async function appendSubmission(rec: SubmissionRecord | SubmissionJsonlRow): Promise<void> {
  const normalized = await prepareSubmissionForLedgerAppend(rec);
  await appendJsonl(SUBMISSIONS_FILE, normalized);
}

export async function appendOwnershipEvent(state: OwnershipState): Promise<void> {
  await appendJsonl(OWNERSHIP_FILE, state);
}

/** Latest ownership row per submission (append order), for batch filters without re-reading JSONL per id. */
export async function getLatestOwnershipBySubmissionMap(): Promise<Map<string, OwnershipState>> {
  const events = await readJsonl<OwnershipState>(OWNERSHIP_FILE);
  const ownerBySubmission = new Map<string, OwnershipState>();
  for (const ev of events) {
    if (ev?.submissionId) ownerBySubmission.set(ev.submissionId, ev);
  }
  return ownerBySubmission;
}

async function readJsonl<T>(filePath: string): Promise<T[]> {
  try {
    const raw = await readFile(filePath, "utf8");
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as T);
  } catch {
    return [];
  }
}

export async function getSubmissionById(id: string): Promise<SubmissionRecord | null> {
  const sid = id.trim();
  if (!sid) return null;
  const records = await readJsonl<SubmissionJsonlRow>(SUBMISSIONS_FILE);
  const history = records.filter((r) => r?.id === sid);
  if (history.length === 0) return null;
  return mergeSubmissionRows(history);
}

export async function getSubmissionByStoredFilename(filename: string): Promise<SubmissionRecord | null> {
  const f = filename.trim();
  if (!f) return null;
  const records = await readJsonl<SubmissionJsonlRow>(SUBMISSIONS_FILE);
  for (let i = records.length - 1; i >= 0; i -= 1) {
    const r = records[i];
    if (r?.storedFile?.filename === f && r.id) return getSubmissionById(r.id);
  }
  return null;
}

/** Latest merged snapshot per submission id (jsonl append order), across all artists. */
export async function listAllSubmissions(): Promise<SubmissionRecord[]> {
  const records = await readJsonl<SubmissionJsonlRow>(SUBMISSIONS_FILE);
  const byId = new Map<string, SubmissionJsonlRow[]>();
  for (const r of records) {
    if (!r?.id) continue;
    const rows = byId.get(r.id) ?? [];
    rows.push(r);
    byId.set(r.id, rows);
  }
  const out: SubmissionRecord[] = [];
  for (const rows of byId.values()) {
    out.push(mergeSubmissionRows(rows));
  }
  out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return out;
}

/**
 * Best-effort 작품명 per submission for operator surfaces.
 * KO: 작가 등록 원장 최초 행의 `artworkTitle`만 사용합니다(인증서·Prisma로 덮지 않음).
 * JA: 作家登録原簿の初回行 `artworkTitle` のみを使います（認証書・Prismaで上書きしない）。
 * EN: Use only the first artist registration `artworkTitle` in submissions.jsonl — never certificates or Prisma.
 */
export async function buildArtworkTitleBySubmissionIdMap(): Promise<Map<string, string>> {
  const records = await readJsonl<SubmissionJsonlRow>(SUBMISSIONS_FILE);
  const map = new Map<string, string>();
  for (const r of records) {
    if (!r?.id) continue;
    if (map.has(r.id)) continue;
    const title = artistTitleFromSubmissionRow(r);
    if (title) map.set(r.id, title);
  }
  return map;
}

export async function appendSubmissionReviewPatch(input: {
  submission: SubmissionRecord;
  reviewerId: string;
  reviewStatus: NonNullable<SubmissionRecord["reviewStatus"]>;
  contentRating: NonNullable<SubmissionRecord["contentRating"]>;
  reviewNote?: string;
  /** When set, overwrites edition fields on the same appended record as the review decision. */
  editionOverride?: {
    editionMode: SubmissionRecord["editionMode"];
    editionTotal: number;
    initialMint: number;
    numberingPolicy: SubmissionRecord["numberingPolicy"];
    lockEdition: boolean;
  };
}): Promise<SubmissionRecord> {
  const { submission, reviewerId, reviewStatus, contentRating, reviewNote, editionOverride } = input;
  const patch: SubmissionRecord = {
    ...submission,
    reviewStatus,
    contentRating,
    reviewNote: reviewNote?.trim() ? reviewNote.trim().slice(0, 800) : undefined,
    reviewedAt: new Date().toISOString(),
    reviewedBy: reviewerId,
  };
  if (editionOverride) {
    patch.editionMode = editionOverride.editionMode;
    patch.editionTotal = editionOverride.editionTotal;
    patch.initialMint = editionOverride.initialMint;
    patch.numberingPolicy = editionOverride.numberingPolicy;
    patch.lockEdition = editionOverride.lockEdition;
  }
  await appendSubmission(patch);
  return patch;
}

export async function getCurrentOwner(submissionId: string, fallbackArtistId: string): Promise<OwnershipState> {
  const events = await readJsonl<OwnershipState>(OWNERSHIP_FILE);
  for (let i = events.length - 1; i >= 0; i -= 1) {
    if (events[i]?.submissionId === submissionId) return events[i]!;
  }
  return {
    submissionId,
    ownerType: "artist",
    ownerId: fallbackArtistId,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Latest `OwnershipState` per submission id (append order), then join to all submissions.
 * KO: 작가가 등록 취소한(`withdrawn`) 제출은 소유가 남아 있어도 Vault 컬렉션 등 목록에서 제외합니다(원장 행은 유지).
 * JA: 作家が登録取消した(`withdrawn`)提出は所有が残ってもVaultコレクション等の一覧から除外します（台帳行は保持）。
 * EN: Artist-withdrawn submissions are omitted from held lists even if ownership rows remain; ledger rows stay for audit.
 */
export async function listSubmissionsHeldByUser(
  userId: string,
): Promise<{ submission: SubmissionRecord; owner: OwnershipState }[]> {
  const uid = userId.trim();
  if (!uid) return [];
  const events = await readJsonl<OwnershipState>(OWNERSHIP_FILE);
  const ownerBySubmission = new Map<string, OwnershipState>();
  for (const ev of events) {
    if (ev?.submissionId) ownerBySubmission.set(ev.submissionId, ev);
  }
  const submissions = await listAllSubmissions();
  const held: { submission: SubmissionRecord; owner: OwnershipState }[] = [];
  for (const rec of submissions) {
    if ((rec.reviewStatus ?? "pending_review") === "withdrawn") continue;
    const owner = ownerBySubmission.get(rec.id) ?? {
      submissionId: rec.id,
      ownerType: "artist" as const,
      ownerId: rec.artistId,
      updatedAt: rec.createdAt,
    };
    if (owner.ownerId === uid) {
      held.push({ submission: rec, owner });
    }
  }
  held.sort((a, b) => (a.submission.createdAt < b.submission.createdAt ? 1 : -1));
  return held;
}

export async function transferOwnershipToBuyer(input: {
  submission: SubmissionRecord;
  buyerId: string;
  buyerRole: "artist" | "collector";
}): Promise<{ toRelativePath: string }> {
  const { submission, buyerId, buyerRole } = input;
  const src = resolveStorageRelativeFile(submission.storedFile.relativePath);
  const targetDir =
    buyerRole === "artist"
      ? buildArtistCollectedWorkDir(buyerId, submission.id)
      : buildCollectorWorkDir(buyerId, submission.id);
  await mkdir(targetDir, { recursive: true });
  const to = path.join(targetDir, submission.storedFile.filename);
  await rename(src, to);

  const toRelativePath = path.relative(STORAGE_ROOT, to);
  const patch: SubmissionRecord = {
    ...submission,
    storedFile: { ...submission.storedFile, relativePath: toRelativePath },
  };
  await appendSubmission(patch);
  await appendOwnershipEvent({
    submissionId: submission.id,
    ownerType: buyerRole === "artist" ? "artist" : "collector",
    ownerId: buyerId,
    updatedAt: new Date().toISOString(),
  });
  return { toRelativePath };
}

export function canAccessSubmission(actor: Actor, submission: SubmissionRecord, owner: OwnershipState): boolean {
  if (actor.role === "operator") return true;
  if (actor.role === "artist" && actor.userId === submission.artistId) return true;
  if (owner.ownerId === actor.userId) return true;
  return false;
}

/** True once ownership has ever moved to any collector for this submission. */
export async function hasCollectorOwnershipEvent(submissionId: string): Promise<boolean> {
  const id = submissionId.trim();
  if (!id) return false;
  const events = await readJsonl<OwnershipState>(OWNERSHIP_FILE);
  for (const ev of events) {
    if (ev?.submissionId === id && ev.ownerType === "collector") return true;
  }
  return false;
}

/**
 * Latest record per submission id (jsonl append order), artist-held only.
 * KO: `withdrawn` 제출은 내 작품 목록에서 제외합니다(append-only 원장에는 남음).
 * JA: `withdrawn`提出はマイ作品一覧から除外します（append-only台帳には残ります）。
 * EN: Withdrawn submissions are excluded from this list; append-only ledger rows remain.
 */
export async function listArtistSubmissions(artistId: string): Promise<SubmissionRecord[]> {
  const aid = artistId.trim();
  if (!aid) return [];
  const records = await readJsonl<SubmissionJsonlRow>(SUBMISSIONS_FILE);
  const byId = new Map<string, SubmissionJsonlRow[]>();
  for (const r of records) {
    if (!r?.id) continue;
    const rows = byId.get(r.id) ?? [];
    rows.push(r);
    byId.set(r.id, rows);
  }
  const out: SubmissionRecord[] = [];
  for (const rows of byId.values()) {
    const rec = mergeSubmissionRows(rows);
    if (rec.artistId !== aid) continue;
    const owner = await getCurrentOwner(rec.id, rec.artistId);
    if (owner.ownerType === "artist" && owner.ownerId === aid) {
      out.push(rec);
    }
  }
  out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return out.filter((r) => (r.reviewStatus ?? "pending_review") !== "withdrawn");
}

/**
 * KO: 작가가 여전히 소유한 제출 중, 운영 검수 메모가 붙은 수정 요청·반려 건수(JSONL 기준).
 * JA: 作家がまだ保有する提出のうち、運営審査メモ付きの修正依頼・却下件数（JSONL基準）。
 * EN: Count of artist-held submissions with operator review note in changes-requested or rejected state (JSONL source).
 */
export async function countArtistOperatorReviewNotices(artistId: string): Promise<number> {
  const subs = await listArtistSubmissions(artistId);
  let n = 0;
  for (const s of subs) {
    if (artistOperatorNoticeNeedsAttention(s)) n += 1;
  }
  return n;
}

/** Approved submissions for public release surfaces (including transferred ownership). */
export async function listApprovedArtistSubmissions(limit = 100): Promise<SubmissionRecord[]> {
  const records = await listAllSubmissions();
  const out: SubmissionRecord[] = [];
  for (const rec of records) {
    if ((rec.reviewStatus ?? "pending_review") !== "approved") continue;
    out.push(rec);
    if (out.length >= limit) break;
  }
  return out;
}

/** True when operator left a review note the artist has not yet acknowledged for this `reviewedAt`. */
export function artistOperatorNoticeNeedsAttention(sub: SubmissionRecord): boolean {
  const st = sub.reviewStatus ?? "pending_review";
  if (st !== "changes_requested" && st !== "rejected") return false;
  if (!sub.reviewNote?.trim()) return false;
  const reviewedAt = sub.reviewedAt?.trim();
  if (!reviewedAt) return false;
  const ack = sub.artistReviewNoticeAcknowledgedAt?.trim();
  if (!ack) return true;
  return ack < reviewedAt;
}

/**
 * ISO 27001 A.12.4.1 (§5) — append-only ledger; idempotent skip if already acknowledged for this review.
 * KO: 작가가 운영 검수 메모를 확인한 시점을 JSONL에 기록해 알림 배지 조건을 해제합니다.
 * JA: 作家が運営審査メモを確認した時刻をJSONLに記録し、通知バッジ条件を解除します。
 * EN: Records when the artist acknowledged the operator review note in JSONL so nav badges clear.
 */
export async function acknowledgeArtistReviewNoticeIfNeeded(
  submissionId: string,
  artistUserId: string,
): Promise<void> {
  const uid = artistUserId.trim();
  const id = submissionId.trim();
  if (!uid || !id) return;
  const sub = await getSubmissionById(id);
  if (!sub || sub.artistId !== uid) return;
  if (!artistOperatorNoticeNeedsAttention(sub)) return;
  await appendSubmission({
    ...sub,
    artistReviewNoticeAcknowledgedAt: new Date().toISOString(),
  });
}

/** Acknowledge every held submission that still needs attention (e.g. after visiting My artworks). */
export async function acknowledgeAllArtistOperatorNotices(artistUserId: string): Promise<void> {
  const uid = artistUserId.trim();
  if (!uid) return;
  const subs = await listArtistSubmissions(uid);
  for (const s of subs) {
    if (artistOperatorNoticeNeedsAttention(s)) {
      await acknowledgeArtistReviewNoticeIfNeeded(s.id, uid);
    }
  }
}

export type WithdrawArtistPendingResult =
  | { ok: true }
  | {
      ok: false;
      error: "not_found" | "forbidden" | "not_withdrawable" | "already_withdrawn" | "after_sale" | "ledger_invalid";
    };

/**
 * ISO 27001 A.9.2.1 (§4), A.14.2.1 (§1) — artist-only while review not finalized; no collector ownership.
 * KO: 검수 대기·수정 요청 단계의 제출만 작가가 등록 철회(append-only)할 수 있으며, 소유 이력이 바뀐 뒤에는 허용하지 않습니다.
 * JA: 審査待ち・修正依頼段階の提出のみ作家が登録取下げ可能で、所蔵履歴が変わった後は禁止します。
 * EN: Artist may withdraw registration only while pending review or changes-requested; blocked after ownership changes.
 */
/**
 * ISO 27001 A.12.4.1 (§5) — append full canonical snapshots (operator repair).
 * KO: 기존 제출마다 병합된 완전 스냅샷을 원장 끝에 한 줄씩 추가해 이후 읽기·표시가 작가 최초 작품명과 일치하게 합니다.
 * JA: 既存提出ごとに統合済み完全スナップショットを原簿末尾へ追記し、以降の表示を作家初回作品名に揃えます。
 * EN: Append one merged full snapshot per submission so later reads use the first artist registration title.
 */
export async function repairCanonicalSubmissionLedgerSnapshots(dryRun: boolean): Promise<{
  dryRun: boolean;
  appended: number;
  skippedEmptyTitle: number;
}> {
  const submissions = await listAllSubmissions();
  let appended = 0;
  let skippedEmptyTitle = 0;
  for (const sub of submissions) {
    if (!sub.artworkTitle.trim()) {
      skippedEmptyTitle += 1;
      continue;
    }
    if (!dryRun) await appendSubmission(sub);
    appended += 1;
  }
  return { dryRun, appended, skippedEmptyTitle };
}

export async function withdrawArtistPendingSubmission(input: {
  submissionId: string;
  artistUserId: string;
}): Promise<WithdrawArtistPendingResult> {
  const uid = input.artistUserId.trim();
  const id = input.submissionId.trim();
  if (!uid || !id) return { ok: false, error: "not_found" };
  const sub = await getSubmissionById(id);
  if (!sub) return { ok: false, error: "not_found" };
  if (sub.artistId !== uid) return { ok: false, error: "forbidden" };
  const st = sub.reviewStatus ?? "pending_review";
  if (st === "withdrawn") return { ok: false, error: "already_withdrawn" };
  if (st !== "pending_review" && st !== "changes_requested") return { ok: false, error: "not_withdrawable" };
  if (await hasCollectorOwnershipEvent(sub.id)) return { ok: false, error: "after_sale" };
  const now = new Date().toISOString();
  try {
    await appendSubmission({
      ...sub,
      reviewStatus: "withdrawn",
      artistWithdrawnAt: now,
      reviewedAt: now,
    });
  } catch (e) {
    if (e instanceof SubmissionLedgerValidationError) {
      return { ok: false, error: "ledger_invalid" };
    }
    throw e;
  }
  return { ok: true };
}

