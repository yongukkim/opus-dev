import { createHash, randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import { LEDGER_FILES } from "@/lib/ledgerStores";
import { appendJsonl, getSubmissionById, type SubmissionRecord } from "@/lib/privateStorage";
import { syncIssuanceToPrismaAfterJsonl } from "@/lib/chroniclePrismaSync";
import { maskSellerId } from "@/lib/collectorTransferListings";

/**
 * Public issuance / provenance Chronicle append-only ledger — path: `LEDGER_FILES.chronicleEntries`.
 *
 * Prisma cutover: optional dual-write after JSONL append when `OPUS_PRISMA_CHRONICLE_DUAL_WRITE=1`
 * (`chroniclePrismaSync`); failures are logged without blocking approval. Future: read path from DB.
 * KO: 동일 공개 투영 타입을 유지한 채 저장소만 Prisma로 이전한다.
 * JA: 同一の公開投影型を保ったまま保存先をPrismaへ移行する。
 * EN: Keep the same public projection type; swap persistence to Prisma ChronicleEntry.
 */
const CHRONICLE_FILE = LEDGER_FILES.chronicleEntries;

/** Mirrors `ChronicleEventType.ISSUED` intent until Prisma cutover (schema.prisma). */
export type ChronicleJsonlEventType = "ISSUED";

export type ChronicleLedgerEntry = {
  id: string;
  submissionId: string;
  occurredAt: string;
  eventType: ChronicleJsonlEventType;
  /** Null for genesis issuance row. */
  fromUserId: string | null;
  /** Custody after issuance (artist studio inventory). */
  toUserId: string;
  reviewerUserId: string;
  note: string;
  prevEntryId: string | null;
  /** sha256 hex chain anchor (off-chain; future optional L2 anchoring may reference this). */
  contentHash: string;
};

export type ChroniclePreviewPublicRow = {
  id: string;
  occurredAt: string;
  eventType: ChronicleJsonlEventType;
  artworkTitle: string;
  custodyToMasked: string;
  note: string;
};

async function readChronicleLines(): Promise<ChronicleLedgerEntry[]> {
  try {
    const raw = await readFile(CHRONICLE_FILE, "utf8");
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as ChronicleLedgerEntry);
  } catch {
    return [];
  }
}

function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

async function lastEntryForSubmission(submissionId: string): Promise<ChronicleLedgerEntry | null> {
  const rows = await readChronicleLines();
  let last: ChronicleLedgerEntry | null = null;
  for (const r of rows) {
    if (r?.submissionId === submissionId) last = r;
  }
  return last;
}

/**
 * ISO 27001 A.12.4.1 (§5) / CLAUDE.md §5 — append-only issuance ledger row (demo JSONL).
 * KO: 운영 승인으로 최초 공개가 확정될 때 ISSUED 행을 체이닝 해시와 함께 추가합니다(온체인 전 단계·무결성 스텁).
 * JA: 運営承認で初公開が確定したとき、ISSUED行をチェーンハッシュ付きで追加します（オンチェーン前段の整合性スタブ）。
 * EN: On first operator approval, append an ISSUED row with a chained hash (pre-chain integrity stub).
 */
export async function appendIssuanceChronicleIfNewlyApproved(input: {
  before: SubmissionRecord;
  written: SubmissionRecord;
}): Promise<string | null> {
  const { before, written } = input;
  if (written.reviewStatus !== "approved") return null;
  if (before.reviewStatus === "approved") return null;

  const prev = await lastEntryForSubmission(written.id);
  const prevHash = prev?.contentHash ?? "GENESIS";
  const occurredAt = written.reviewedAt ?? new Date().toISOString();
  const note = `Authorized edition window: ${written.initialMint}/${written.editionTotal} (${written.editionMode})`;
  const payload = [
    prevHash,
    "ISSUED",
    "",
    written.artistId,
    occurredAt,
    written.id,
    note,
    written.reviewedBy ?? "",
  ].join("|");
  const contentHash = sha256Hex(payload);
  const id = `${Date.now().toString(36)}-${randomBytes(6).toString("hex")}`;
  const row: ChronicleLedgerEntry = {
    id,
    submissionId: written.id,
    occurredAt,
    eventType: "ISSUED",
    fromUserId: null,
    toUserId: written.artistId,
    reviewerUserId: written.reviewedBy ?? "",
    note,
    prevEntryId: prev?.id ?? null,
    contentHash,
  };
  await appendJsonl(CHRONICLE_FILE, row);
  void syncIssuanceToPrismaAfterJsonl(written, occurredAt);
  return row.id;
}

export async function listPublicChroniclePreviewRows(limit: number): Promise<ChroniclePreviewPublicRow[]> {
  const rows = await readChronicleLines();
  const sorted = [...rows].sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1));
  const slice = sorted.slice(0, Math.max(0, limit));
  const out: ChroniclePreviewPublicRow[] = [];
  for (const r of slice) {
    const sub = await getSubmissionById(r.submissionId);
    out.push({
      id: r.id,
      occurredAt: r.occurredAt,
      eventType: r.eventType,
      artworkTitle: sub?.artworkTitle?.trim() ? sub.artworkTitle.trim() : "—",
      custodyToMasked: maskSellerId(r.toUserId),
      note: r.note,
    });
  }
  return out;
}
