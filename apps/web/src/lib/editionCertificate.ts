import { createHash, createHmac, randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import { LEDGER_FILES } from "@/lib/ledgerStores";
import { appendJsonl, getSubmissionById, type SubmissionRecord } from "@/lib/privateStorage";

const CERT_FILE = LEDGER_FILES.editionCertificates;
const SCHEMA = "opus.edition_certificate.v1" as const;

export type EditionCertificateEvent = "ISSUED" | "CUSTODY_TRANSFER";

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
  return (
    typeof r.bindingKey === "string" &&
    typeof r.version === "number" &&
    typeof r.payloadDigest === "string" &&
    typeof r.signature === "string" &&
    typeof r.submissionId === "string" &&
    typeof r.editionNumber === "number"
  );
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
export async function issueEditionCertificatesOnApproval(
  submission: SubmissionRecord,
  chronicleIssuanceId: string | null,
): Promise<void> {
  if (submission.reviewStatus !== "approved") return;
  const secret = editionCertificateSecret();
  const approvedAt = submission.reviewedAt ?? new Date().toISOString();
  const artistDisplayName = (submission.nickname || submission.artistName || "").trim().slice(0, 256);
  const title = submission.artworkTitle.trim().slice(0, 256);

  for (let n = 1; n <= submission.initialMint; n += 1) {
    const bindingKey = editionBindingKey(submission.id, n);
    const existing = await getLatestEditionCertificate(submission.id, n);
    if (existing) continue;

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
    const row: EditionCertificateRecord = {
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
    await appendJsonl(CERT_FILE, row);
  }
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
  const title = submission.artworkTitle.trim().slice(0, 256);

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
    const row: EditionCertificateRecord = {
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
    await appendJsonl(CERT_FILE, row);
  }
}
