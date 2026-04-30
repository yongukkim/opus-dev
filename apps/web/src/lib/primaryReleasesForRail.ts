import { listOpenCollectorTransferListings } from "@/lib/collectorTransferListings";
import {
  getLatestOwnershipBySubmissionMap,
  listAllSubmissions,
  type OwnershipState,
  type SubmissionRecord,
} from "@/lib/privateStorage";

/**
 * ISO 27001 A.9.2.1 (§4) — public “primary release” rail is not mixed with open custody-transfer listings.
 * KO: 신작(1차) 레일은 작가가 아직 소유한 승인 제출만 포함하고, 소장계보에 열린 리스팅에 묶인 제출·타 소유는 제외합니다.
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
