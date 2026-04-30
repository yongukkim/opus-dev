import { COLLECTOR_TRANSFER_GENRES } from "@/lib/collectorTransferListings";
import { getCurrentOwner, getSubmissionById, type SubmissionRecord } from "@/lib/privateStorage";

/**
 * ISO 27001 A.9.2.1 (§4) / A.14.2.1 (§1)
 * KO: 이전 등록 시 작품 메타는 제출 레코드에서만 채우며, 세션 소유자와 승인 상태를 서버에서 다시 검증합니다.
 * JA: 譲渡登録の作品メタは提出レコードのみから埋め、セッション所有者と承認状態をサーバで再検証します。
 * EN: Transfer artwork metadata is sourced only from the submission record; server re-validates owner and approval.
 */
export type TransferRegisterLockedWork = {
  submissionId: string;
  /** Shown read-only when visibility is public; otherwise empty with redacted flag. */
  artistLegalName: string;
  artistLegalNameRedacted: boolean;
  artistPenName: string;
  artworkTitle: string;
  genre: string;
  year: string;
  description: string;
  tags: string;
  editionRef: string;
};

export function artworkFieldsFromSubmission(
  rec: SubmissionRecord,
): Pick<
  TransferRegisterLockedWork,
  | "artistLegalName"
  | "artistLegalNameRedacted"
  | "artistPenName"
  | "artworkTitle"
  | "genre"
  | "year"
  | "description"
  | "tags"
  | "editionRef"
> {
  const genre = COLLECTOR_TRANSFER_GENRES.has(rec.genre) ? rec.genre : "other";
  const year = rec.year != null && Number.isFinite(rec.year) ? String(rec.year) : "";
  const tags = Array.isArray(rec.tags) ? rec.tags.map((x) => x.trim()).filter(Boolean).join(", ") : "";
  const editionRef =
    rec.editionMode === "unique" ? "Edition 1/1" : `Edition ${rec.initialMint}/${rec.editionTotal}`;
  const legal = (rec.artistName ?? "").trim();
  const redacted = rec.artistNameVisibility !== "public";
  const artistPenName = (rec.nickname?.trim() || rec.artistName?.trim() || "—").trim() || "—";
  return {
    artistLegalName: redacted ? "" : legal,
    artistLegalNameRedacted: redacted,
    artistPenName,
    artworkTitle: rec.artworkTitle.trim(),
    genre,
    year,
    description: (rec.description ?? "").trim(),
    tags,
    editionRef,
  };
}

export async function resolveTransferRegisterLockedWork(
  submissionId: string,
  sessionUserId: string,
): Promise<TransferRegisterLockedWork | null> {
  const id = submissionId.trim();
  if (!id || id.length > 120) return null;
  const rec = await getSubmissionById(id);
  if (!rec) return null;
  if ((rec.reviewStatus ?? "pending_review") !== "approved") return null;
  const owner = await getCurrentOwner(rec.id, rec.artistId);
  if (owner.ownerId !== sessionUserId) return null;
  // Custody transfer registration is for acquired editions, not the artist’s own first registration.
  if (rec.artistId === sessionUserId) return null;

  const core = artworkFieldsFromSubmission(rec);
  return {
    submissionId: rec.id,
    ...core,
  };
}

/**
 * True when the work is approved, held by the user, and the user is the registering artist
 * (this page and API block opening a transfer form for the artist’s own inventory).
 * KO: 직접 제출한 작가 본인 소장이면 이전 등록 UI를 열지 않습니다.
 * JA: 自ら提出した作家本人の所蔵なら、譲渡登録UIを開きません。
 * EN: The artist’s own first-registration hold has no transfer form here; use My Artworks.
 */
export async function isHeldApprovedOwnArtistRegistration(
  submissionId: string,
  sessionUserId: string,
): Promise<boolean> {
  const id = submissionId.trim();
  const sid = sessionUserId.trim();
  if (!id || !sid) return false;
  const rec = await getSubmissionById(id);
  if (!rec) return false;
  if ((rec.reviewStatus ?? "pending_review") !== "approved") return false;
  if (rec.artistId !== sid) return false;
  const owner = await getCurrentOwner(rec.id, rec.artistId);
  return owner.ownerId === sid;
}
