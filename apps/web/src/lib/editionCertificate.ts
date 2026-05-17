import { createHash, createHmac, randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import { LEDGER_FILES } from "@/lib/ledgerStores";
import {
  appendJsonl,
  getCanonicalArtistArtworkTitle,
  getSubmissionById,
  type SubmissionRecord,
} from "@/lib/privateStorage";

const CERT_FILE = LEDGER_FILES.editionCertificates;
const SCHEMA = "opus.edition_certificate.v1" as const;
/** Public commitment inputs (SHA-256) — independent of the HMAC certificate signature. */
const TIME_ANCHOR_SCHEMA = "opus.time_anchor.v1" as const;

export type EditionCertificateEvent = "ISSUED" | "CUSTODY_TRANSFER";

/**
 * Optional time-binding / third-party anchor metadata (JSONL row).
 * KO: 온체인·TSA 등 외부 고정은 선택 필드로 두고, commitment는 공개 필드만으로 재계산 가능합니다.
 * JA: オンチェーン・TSA 等は任意。commitment は公開フィールドのみで再計算できます。
 * EN: External anchors are optional; `commitmentHex` is reproducible from public certificate fields alone.
 */
export type EditionCertificateTimeAnchor = {
  schema: typeof TIME_ANCHOR_SCHEMA;
  /** SHA-256 hex over canonical time-anchor payload (binds signed `payloadDigest` + edition binding). */
  commitmentHex: string;
  /** When OPUS attached this anchor row (usually issuance instant). */
  anchoredAtIso: string;
  /** CAIP-2 chain id when an on-chain anchor exists (e.g. `eip155:1`). */
  chainId?: string;
  /** Public transaction hash when anchored on-chain. */
  txHash?: string;
  /** Opaque handle to a TSA token / attestation blob (future). */
  externalAttestationRef?: string;
};

/**
 * ISO 27001 A.10.1.1 (§3) / A.12.4.1 (§5) / A.9.2.1 (§4)
 * KO: 인증서 서명 키는 코드에 넣지 않고 환경변수에서만 읽으며, 생산에서는 `OPUS_EDITION_CERTIFICATE_SECRET`(또는 긴 `AUTH_SECRET`)을 요구합니다.
 * JA: 認証書署名鍵はコードに埋め込まず環境変数のみ。本番では専用シークレットまたは十分長い AUTH_SECRET を要求します。
 * EN: Certificate signing material comes only from env; production should set `OPUS_EDITION_CERTIFICATE_SECRET` or a long `AUTH_SECRET`.
 */
export function editionCertificateSecret(): string {
  const s =
    process.env["OPUS_EDITION_CERTIFICATE_SECRET"]?.trim() ||
    process.env["AUTH_SECRET"]?.trim() ||
    process.env["NEXTAUTH_SECRET"]?.trim() ||
    "";
  if (s.length >= 32) return s;
  if (process.env["NODE_ENV"] === "production") {
    throw new Error(
      "[edition-certificate] Set OPUS_EDITION_CERTIFICATE_SECRET (or AUTH_SECRET) to a random string of at least 32 bytes.",
    );
  }
  return "opus-dev-edition-certificate-secret-32b!";
}

export type EditionCertificateRecord = {
  id: string;
  bindingKey: string;
  version: number;
  event: EditionCertificateEvent;
  submissionId: string;
  editionNumber: number;
  editionTotal: number;
  editionMode: string;
  artworkTitle: string;
  artistDisplayName: string;
  approvedAtIso: string;
  chronicleIssuanceId: string;
  issuedAtIso: string;
  custodyUserId: string;
  custodyOwnerType: "artist" | "collector";
  priorCertificateId: string;
  priorPayloadDigest: string;
  payloadDigest: string;
  signature: string;
  /** Present on rows issued after time-anchor support; older JSONL lines omit this field. */
  timeAnchor?: EditionCertificateTimeAnchor;
};

export function editionBindingKey(submissionId: string, editionNumber: number): string {
  return `${submissionId.trim()}#e${editionNumber}`;
}

function sha256Hex(s: string): string {
  return createHash("sha256").update(s, "utf8").digest("hex");
}

function signDigest(secret: string, digestHex: string): string {
  return createHmac("sha256", secret).update(digestHex, "utf8").digest("hex");
}

function canonicalSigningPayload(input: Record<string, string | number>): string {
  const keys = Object.keys(input).sort();
  const ordered: Record<string, string | number> = {};
  for (const k of keys) ordered[k] = input[k]!;
  return JSON.stringify(ordered);
}

/**
 * ISO 27001 A.10.1.1 (§3) / A.12.4.1 (§5)
 * KO: 공개 필드만으로 commitment를 재계산하면 무결한 JSON과 OPUS 서명(`payloadDigest` 검증)이 암시적으로 연결됩니다.
 * JA: 公開フィールドのみで commitment を再計算し、整合する JSON と OPUS 署名（`payloadDigest` 検証）とを結びつけます。
 * EN: Recomputing the commitment from public fields ties the JSON row to the OPUS signature via `payloadDigest`.
 */
export function computeEditionCertificateTimeAnchorCommitment(
  record: Pick<
    EditionCertificateRecord,
    "payloadDigest" | "bindingKey" | "id" | "chronicleIssuanceId" | "issuedAtIso" | "version" | "event"
  >,
): string {
  const body = canonicalSigningPayload({
    schema: TIME_ANCHOR_SCHEMA,
    bindingKey: record.bindingKey,
    certificateId: record.id,
    chronicleIssuanceId: record.chronicleIssuanceId,
    event: record.event,
    issuedAtIso: record.issuedAtIso,
    payloadDigest: record.payloadDigest,
    version: record.version,
  });
  return sha256Hex(body);
}

export type EditionTimeAnchorVerifyStatus = "ok" | "mismatch" | "legacy";

export function verifyEditionCertificateTimeAnchor(record: EditionCertificateRecord): {
  status: EditionTimeAnchorVerifyStatus;
  computedCommitmentHex: string;
  stored?: EditionCertificateTimeAnchor;
} {
  const computedCommitmentHex = computeEditionCertificateTimeAnchorCommitment(record);
  const stored = record.timeAnchor;
  if (!stored?.commitmentHex) {
    return { status: "legacy", computedCommitmentHex };
  }
  if (stored.schema !== TIME_ANCHOR_SCHEMA) {
    return { status: "mismatch", computedCommitmentHex, stored };
  }
  if (stored.commitmentHex !== computedCommitmentHex) {
    return { status: "mismatch", computedCommitmentHex, stored };
  }
  return { status: "ok", computedCommitmentHex, stored };
}

function buildEditionCertificateTimeAnchor(
  record: Pick<
    EditionCertificateRecord,
    "payloadDigest" | "bindingKey" | "id" | "chronicleIssuanceId" | "issuedAtIso" | "version" | "event"
  >,
): EditionCertificateTimeAnchor {
  return {
    schema: TIME_ANCHOR_SCHEMA,
    commitmentHex: computeEditionCertificateTimeAnchorCommitment(record),
    anchoredAtIso: record.issuedAtIso,
  };
}

/** Latest row per `bindingKey` (highest `version`). */
export async function listAllEditionCertificateRecords(): Promise<EditionCertificateRecord[]> {
  const rows = (await readAllCertificates()).filter(isRecord);
  const byBinding = new Map<string, EditionCertificateRecord>();
  for (const r of rows) {
    const prev = byBinding.get(r.bindingKey);
    if (!prev || r.version > prev.version) byBinding.set(r.bindingKey, r);
  }
  return [...byBinding.values()];
}

async function readAllCertificates(): Promise<EditionCertificateRecord[]> {
  try {
    const raw = await readFile(CERT_FILE, "utf8");
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as EditionCertificateRecord);
  } catch {
    return [];
  }
}

function isRecord(x: unknown): x is EditionCertificateRecord {
  if (!x || typeof x !== "object") return false;
  const r = x as EditionCertificateRecord;
  if (
    typeof r.bindingKey !== "string" ||
    typeof r.version !== "number" ||
    typeof r.payloadDigest !== "string" ||
    typeof r.signature !== "string" ||
    typeof r.submissionId !== "string" ||
    typeof r.editionNumber !== "number"
  ) {
    return false;
  }
  if (r.timeAnchor !== undefined && r.timeAnchor !== null) {
    if (typeof r.timeAnchor !== "object") return false;
  }
  return true;
}

export function verifyEditionCertificateRecord(record: EditionCertificateRecord): boolean {
  try {
    const secret = editionCertificateSecret();
    const signing = canonicalSigningPayload({
      schema: SCHEMA,
      bindingKey: record.bindingKey,
      submissionId: record.submissionId,
      editionNumber: record.editionNumber,
      editionTotal: record.editionTotal,
      editionMode: record.editionMode,
      artworkTitle: record.artworkTitle,
      artistDisplayName: record.artistDisplayName,
      approvedAtIso: record.approvedAtIso,
      chronicleIssuanceId: record.chronicleIssuanceId,
      issuedAtIso: record.issuedAtIso,
      version: record.version,
      event: record.event,
      priorCertificateId: record.priorCertificateId,
      priorPayloadDigest: record.priorPayloadDigest,
      custodyUserId: record.custodyUserId,
      custodyOwnerType: record.custodyOwnerType,
    });
    const digest = sha256Hex(signing);
    if (digest !== record.payloadDigest) return false;
    const sig = signDigest(secret, digest);
    return sig === record.signature;
  } catch {
    return false;
  }
}

/** All valid certificate rows (operator list enrichment). */
export async function listAllEditionCertificates(): Promise<EditionCertificateRecord[]> {
  const rows = await readAllCertificates();
  return rows.filter(isRecord);
}

export async function getLatestEditionCertificate(
  submissionId: string,
  editionNumber: number,
): Promise<EditionCertificateRecord | null> {
  const binding = editionBindingKey(submissionId, editionNumber);
  const rows = await readAllCertificates();
  let best: EditionCertificateRecord | null = null;
  for (const r of rows) {
    if (!isRecord(r) || r.bindingKey !== binding) continue;
    if (!best || r.version > best.version) best = r;
  }
  return best;
}

/**
 * ISO 27001 A.12.4.1 (§5) — idempotent first issuance per `bindingKey` when operator approves.
 * KO: 승인 시 `initialMint` 범위 에디션마다 서명 인증서 v1을 append-only로 남깁니다(이미 있으면 건너뜀).
 * JA: 承認時に initialMint 範囲の各エディションへ署名付き認証書v1を追記します（既存ならスキップ）。
 * EN: On approval, append a signed v1 certificate per edition in `initialMint` range (skip if already present).
 */
/**
 * ISO 27001 A.12.4.1 (§5)
 * KO: 검수 완료 작품인데 인증서 행이 없을 때(배포 이전 승인·발행 시 부가기록 실패 등) 보기·JSON 요청에서 idempotent하게 보정합니다.
 * JA: 審査済みだが認証書行がない場合に、閲覧・JSON取得時に冪等で補完します。
 * EN: Idempotently append missing signed rows for approved submissions when read paths find none (pre-feature approvals or auxiliary write failures).
 */
export async function ensureEditionCertificatesBackfill(submission: SubmissionRecord): Promise<void> {
  if (submission.reviewStatus !== "approved") return;
  const result = await issueEditionCertificatesOnApprovalWithResult(submission, null);
  if (!result.ok) {
    console.error("[edition-certificate]", JSON.stringify({ event: "backfill_failed", ...result, submissionId: submission.id }));
  }
}

/** Approved submissions in JSONL that are missing at least one expected certificate binding. */
export async function listApprovedSubmissionsMissingCertificates(): Promise<string[]> {
  const { listAllSubmissions } = await import("@/lib/privateStorage");
  const submissions = await listAllSubmissions();
  const approved = submissions.filter((s) => (s.reviewStatus ?? "pending_review") === "approved");
  const missing: string[] = [];
  for (const sub of approved) {
    for (let n = 1; n <= sub.initialMint; n += 1) {
      const existing = await getLatestEditionCertificate(sub.id, n);
      if (!existing) {
        missing.push(sub.id);
        break;
      }
    }
  }
  return [...new Set(missing)];
}

export type EditionCertificateIssuanceResult =
  | { ok: true; issued: number; skippedExisting: number }
  | {
      ok: false;
      reason: "not_approved" | "missing_title" | "signing_error";
      detail?: string;
    };

/**
 * ISO 27001 A.12.4.1 (§5)
 * KO: 승인 시 인증서 JSONL 발행 결과를 반환합니다(실패 시 운영 로그·보정 API에서 확인 가능).
 * JA: 承認時の認証書JSONL発行結果を返します（失敗時は運用ログ・補完APIで確認）。
 * EN: Returns signed certificate JSONL issuance outcome (failures are visible to ops logs/repair APIs).
 */
export async function issueEditionCertificatesOnApprovalWithResult(
  submission: SubmissionRecord,
  chronicleIssuanceId: string | null,
): Promise<EditionCertificateIssuanceResult> {
  if (submission.reviewStatus !== "approved") {
    return { ok: false, reason: "not_approved" };
  }
  const secret = editionCertificateSecret();
  const approvedAt = submission.reviewedAt ?? new Date().toISOString();
  const artistDisplayName = (submission.nickname || submission.artistName || "").trim().slice(0, 256);
  const title = ((await getCanonicalArtistArtworkTitle(submission.id)) || submission.artworkTitle).trim().slice(0, 256);
  if (!title) {
    console.error(
      "[edition-certificate]",
      JSON.stringify({ event: "issuance_skipped_missing_title", submissionId: submission.id }),
    );
    return { ok: false, reason: "missing_title", detail: submission.id };
  }

  let issued = 0;
  let skippedExisting = 0;

  try {
  for (let n = 1; n <= submission.initialMint; n += 1) {
    const bindingKey = editionBindingKey(submission.id, n);
    const existing = await getLatestEditionCertificate(submission.id, n);
    if (existing) {
      skippedExisting += 1;
      continue;
    }

    const issuedAtIso = new Date().toISOString();
    const signing = canonicalSigningPayload({
      schema: SCHEMA,
      bindingKey,
      submissionId: submission.id,
      editionNumber: n,
      editionTotal: submission.editionTotal,
      editionMode: submission.editionMode,
      artworkTitle: title,
      artistDisplayName,
      approvedAtIso: approvedAt,
      chronicleIssuanceId: chronicleIssuanceId ?? "",
      issuedAtIso,
      version: 1,
      event: "ISSUED",
      priorCertificateId: "",
      priorPayloadDigest: "",
      custodyUserId: submission.artistId,
      custodyOwnerType: "artist",
    });
    const payloadDigest = sha256Hex(signing);
    const signature = signDigest(secret, payloadDigest);
    const rowBase: EditionCertificateRecord = {
      id: `${Date.now().toString(36)}-${randomBytes(6).toString("hex")}`,
      bindingKey,
      version: 1,
      event: "ISSUED",
      submissionId: submission.id,
      editionNumber: n,
      editionTotal: submission.editionTotal,
      editionMode: submission.editionMode,
      artworkTitle: title,
      artistDisplayName,
      approvedAtIso: approvedAt,
      chronicleIssuanceId: chronicleIssuanceId ?? "",
      issuedAtIso,
      custodyUserId: submission.artistId,
      custodyOwnerType: "artist",
      priorCertificateId: "",
      priorPayloadDigest: "",
      payloadDigest,
      signature,
    };
    const row: EditionCertificateRecord = {
      ...rowBase,
      timeAnchor: buildEditionCertificateTimeAnchor(rowBase),
    };
    await appendJsonl(CERT_FILE, row);
    issued += 1;
  }
  } catch (err: unknown) {
    const name = err instanceof Error ? err.name : "UnknownError";
    console.error(
      "[edition-certificate]",
      JSON.stringify({ event: "issuance_failed", submissionId: submission.id, errorName: name }),
    );
    return { ok: false, reason: "signing_error", detail: name };
  }

  return { ok: true, issued, skippedExisting };
}

export async function issueEditionCertificatesOnApproval(
  submission: SubmissionRecord,
  chronicleIssuanceId: string | null,
): Promise<void> {
  await issueEditionCertificatesOnApprovalWithResult(submission, chronicleIssuanceId);
}

/** Idempotently issue missing signed certificate rows for approved submissions (ops repair). */
export async function issueMissingEditionCertificates(input?: {
  dryRun?: boolean;
  submissionIds?: string[];
}): Promise<{
  scanned: number;
  missingSubmissionIds: string[];
  issued: number;
  skippedExisting: number;
  failures: Array<{ submissionId: string; reason: string; detail?: string }>;
}> {
  const dryRun = input?.dryRun === true;
  const filter = input?.submissionIds?.map((id) => id.trim()).filter(Boolean);
  const filterSet = filter && filter.length > 0 ? new Set(filter) : null;

  const { listAllSubmissions } = await import("@/lib/privateStorage");
  const submissions = await listAllSubmissions();
  const approved = submissions.filter((s) => (s.reviewStatus ?? "pending_review") === "approved");
  const missingSubmissionIds = await listApprovedSubmissionsMissingCertificates();
  const targets = missingSubmissionIds.filter((id) => !filterSet || filterSet.has(id));

  if (dryRun) {
    return {
      scanned: approved.length,
      missingSubmissionIds: targets,
      issued: 0,
      skippedExisting: 0,
      failures: [],
    };
  }

  let issued = 0;
  let skippedExisting = 0;
  const failures: Array<{ submissionId: string; reason: string; detail?: string }> = [];

  for (const submissionId of targets) {
    const submission = approved.find((s) => s.id === submissionId);
    if (!submission) continue;
    const result = await issueEditionCertificatesOnApprovalWithResult(submission, null);
    if (result.ok) {
      issued += result.issued;
      skippedExisting += result.skippedExisting;
    } else {
      failures.push({ submissionId, reason: result.reason, detail: result.detail });
    }
  }

  return {
    scanned: approved.length,
    missingSubmissionIds: targets,
    issued,
    skippedExisting,
    failures,
  };
}

/**
 * ISO 27001 A.12.4.1 (§5) — new signed row per edition so the certificate “moves” with custody (same `bindingKey`, higher `version`).
 * KO: 소유 이전이 확정되면 동일 `bindingKey`로 버전을 올려 수탁자를 반영한 인증서를 다시 남깁니다.
 * JA: 保管移転確定後、同一 bindingKey でバージョンを上げた認証書を追記します。
 * EN: After custody transfer, append a higher-version certificate for the same binding key with the new custodian.
 */
export async function reissueEditionCertificatesOnCustodyTransfer(input: {
  submissionId: string;
  newCustodyUserId: string;
  newOwnerType: "artist" | "collector";
}): Promise<void> {
  const submissionId = input.submissionId.trim();
  const newCustodyUserId = input.newCustodyUserId.trim();
  if (!submissionId || !newCustodyUserId) return;

  const submission = await getSubmissionById(submissionId);
  if (!submission || submission.reviewStatus !== "approved") return;

  const secret = editionCertificateSecret();
  const approvedAt = submission.reviewedAt ?? new Date().toISOString();
  const artistDisplayName = (submission.nickname || submission.artistName || "").trim().slice(0, 256);
  const title = ((await getCanonicalArtistArtworkTitle(submission.id)) || submission.artworkTitle).trim().slice(0, 256);
  if (!title) return;

  for (let n = 1; n <= submission.initialMint; n += 1) {
    const latest = await getLatestEditionCertificate(submissionId, n);
    if (!latest) continue;
    if (latest.custodyUserId === newCustodyUserId && latest.custodyOwnerType === input.newOwnerType) continue;

    const nextVersion = latest.version + 1;
    const issuedAtIso = new Date().toISOString();
    const signing = canonicalSigningPayload({
      schema: SCHEMA,
      bindingKey: latest.bindingKey,
      submissionId: submission.id,
      editionNumber: n,
      editionTotal: submission.editionTotal,
      editionMode: submission.editionMode,
      artworkTitle: title,
      artistDisplayName,
      approvedAtIso: approvedAt,
      chronicleIssuanceId: latest.chronicleIssuanceId,
      issuedAtIso,
      version: nextVersion,
      event: "CUSTODY_TRANSFER",
      priorCertificateId: latest.id,
      priorPayloadDigest: latest.payloadDigest,
      custodyUserId: newCustodyUserId,
      custodyOwnerType: input.newOwnerType,
    });
    const payloadDigest = sha256Hex(signing);
    const signature = signDigest(secret, payloadDigest);
    const rowBase: EditionCertificateRecord = {
      id: `${Date.now().toString(36)}-${randomBytes(6).toString("hex")}`,
      bindingKey: latest.bindingKey,
      version: nextVersion,
      event: "CUSTODY_TRANSFER",
      submissionId: submission.id,
      editionNumber: n,
      editionTotal: submission.editionTotal,
      editionMode: submission.editionMode,
      artworkTitle: title,
      artistDisplayName,
      approvedAtIso: approvedAt,
      chronicleIssuanceId: latest.chronicleIssuanceId,
      issuedAtIso,
      custodyUserId: newCustodyUserId,
      custodyOwnerType: input.newOwnerType,
      priorCertificateId: latest.id,
      priorPayloadDigest: latest.payloadDigest,
      payloadDigest,
      signature,
    };
    const row: EditionCertificateRecord = {
      ...rowBase,
      timeAnchor: buildEditionCertificateTimeAnchor(rowBase),
    };
    await appendJsonl(CERT_FILE, row);
  }
}
