import { listOpenCollectorTransferListings } from "@/lib/collectorTransferListings";
import {
  getLatestOwnershipBySubmissionMap,
  listAllSubmissions,
  type OwnershipState,
  type SubmissionRecord,
} from "@/lib/privateStorage";

/**
 * ISO 27001 A.9.2.1 (§4) — public “primary release” rail is not mixed with open custody-transfer listings.
 * KO: 신작(1차) 레일은 작가가 아직 소유한 승인 제출만 포함하고, 소장품에 열린 리스팅에 묶인 제출·타 소유는 제외합니다.
 * JA: 新作レールは作家がまだ保有する承認済み提出のみとし、来歴側の公開リスティングに紐づく提出は除外します。
 * EN: Primary-release rail keeps artist-held approved submissions only; excludes rows tied to open provenance listings or non–studio-hold.
 */
export async function listApprovedPrimaryReleasesForRail(limit?: number): Promise<SubmissionRecord[]> {
  const [listings, ownerMap, all] = await Promise.all([
    listOpenCollectorTransferListings(),
    getLatestOwnershipBySubmissionMap(),
    listAllSubmissions(),
  ]);
  const listedSources = new Set<string>();
  for (const l of listings) {
    if (l.sourceSubmissionId) listedSources.add(l.sourceSubmissionId);
  }
  const out: SubmissionRecord[] = [];
  for (const rec of all) {
    if ((rec.reviewStatus ?? "pending_review") !== "approved") continue;
    if (listedSources.has(rec.id)) continue;
    const owner: OwnershipState =
      ownerMap.get(rec.id) ??
      ({
        submissionId: rec.id,
        ownerType: "artist",
        ownerId: rec.artistId,
        updatedAt: rec.createdAt,
      } as OwnershipState);
    if (!(owner.ownerType === "artist" && owner.ownerId === rec.artistId)) continue;
    out.push(rec);
    if (limit != null && out.length >= limit) break;
  }
  return out;
}

/**
 * ISO 27001 A.9.2.1 (§4) — same channel rules as `listApprovedPrimaryReleasesForRail`, scoped to one artist for discovery rails (e.g. checkout).
 * KO: 한 작가의 신작(1차) 공개 중 다른 승인 제출만 반환하며, 현재 제출 행은 제외합니다.
 * JA: 同一作家の承認済み新作(一次)公開から現在行を除いた一覧を返します。
 * EN: Returns other artist-held primary approved submissions for one artist, excluding the current row.
 */
export async function listApprovedPrimaryReleasesByArtistExcept(
  artistId: string,
  excludeSubmissionId: string,
  limit: number,
): Promise<SubmissionRecord[]> {
  const id = artistId.trim();
  const ex = excludeSubmissionId.trim();
  if (!id || !ex || limit <= 0) return [];

  const [listings, ownerMap, all] = await Promise.all([
    listOpenCollectorTransferListings(),
    getLatestOwnershipBySubmissionMap(),
    listAllSubmissions(),
  ]);
  const listedSources = new Set<string>();
  for (const l of listings) {
    if (l.sourceSubmissionId) listedSources.add(l.sourceSubmissionId);
  }
  const out: SubmissionRecord[] = [];
  for (const rec of all) {
    if (rec.artistId !== id) continue;
    if (rec.id === ex) continue;
    if ((rec.reviewStatus ?? "pending_review") !== "approved") continue;
    if (listedSources.has(rec.id)) continue;
    const owner: OwnershipState =
      ownerMap.get(rec.id) ??
      ({
        submissionId: rec.id,
        ownerType: "artist",
        ownerId: rec.artistId,
        updatedAt: rec.createdAt,
      } as OwnershipState);
    if (!(owner.ownerType === "artist" && owner.ownerId === rec.artistId)) continue;
    out.push(rec);
    if (out.length >= limit) break;
  }
  return out;
}
