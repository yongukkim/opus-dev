import { listAllSubmissions } from "@/lib/privateStorage";
import { prisma } from "@/lib/prisma";

export type ArtistArtworkMetrics = {
  /** Distinct submission ids on the ledger (any review status). */
  registrations: number;
  /** Distinct approved works (ledger `approved` + Prisma `APPROVED`). */
  approved: number;
};

function buildUniqueArtistPenNameIndex(
  artists: Array<{ id: string; name: string | null }>,
): Map<string, string> {
  const byName = new Map<string, string[]>();
  for (const a of artists) {
    const key = a.name?.trim().toLowerCase();
    if (!key) continue;
    const list = byName.get(key) ?? [];
    list.push(a.id);
    byName.set(key, list);
  }
  const out = new Map<string, string>();
  for (const [key, ids] of byName) {
    if (ids.length === 1) out.set(key, ids[0]!);
  }
  return out;
}

function resolveSubmissionArtistUserId(input: {
  submissionArtistId: string;
  nickname: string;
  knownArtistIds: Set<string>;
  penNameToUserId: Map<string, string>;
}): string | null {
  const direct = input.submissionArtistId.trim();
  if (direct && input.knownArtistIds.has(direct)) return direct;

  const nickKey = input.nickname.trim().toLowerCase();
  if (!nickKey) return direct || null;
  const byPen = input.penNameToUserId.get(nickKey);
  if (byPen) return byPen;

  return direct || null;
}

/**
 * Operator member list artwork metrics — ledger-first, Prisma-approved merge, pen-name fallback for legacy `artistId`.
 * KO: 제출 원장·DB 승인 작품을 작가 User.id 기준으로 집계하며, 레거시 artistId 불일치 시 필명이 유일할 때만 귀속합니다.
 * JA: 提出原簿とDB承認作品を作家 User.id で集計し、レガシー artistId 不一致時はペンネームが一意のときのみ帰属します。
 * EN: Aggregate ledger + Prisma approved works per artist User.id; attribute legacy rows only when pen name maps uniquely.
 */
export async function countArtistArtworkMetricsByUserId(): Promise<Map<string, ArtistArtworkMetrics>> {
  const [submissions, artists, prismaArtworks] = await Promise.all([
    listAllSubmissions(),
    prisma.user.findMany({
      where: { role: "ARTIST" },
      select: { id: true, name: true },
    }),
    prisma.artwork.findMany({
      where: { reviewStatus: "APPROVED" },
      select: { id: true, artistUserId: true, opusSubmissionId: true },
    }),
  ]);

  const knownArtistIds = new Set(artists.map((a) => a.id));
  const penNameToUserId = buildUniqueArtistPenNameIndex(artists);

  const buckets = new Map<string, { registrations: Set<string>; approved: Set<string> }>();

  const touch = (userId: string, workKey: string, approved: boolean) => {
    const uid = userId.trim();
    if (!uid) return;
    let b = buckets.get(uid);
    if (!b) {
      b = { registrations: new Set(), approved: new Set() };
      buckets.set(uid, b);
    }
    b.registrations.add(workKey);
    if (approved) b.approved.add(workKey);
  };

  for (const s of submissions) {
    const uid = resolveSubmissionArtistUserId({
      submissionArtistId: s.artistId,
      nickname: s.nickname,
      knownArtistIds,
      penNameToUserId,
    });
    if (!uid) continue;
    const approved = (s.reviewStatus ?? "pending_review") === "approved";
    touch(uid, `submission:${s.id}`, approved);
  }

  for (const a of prismaArtworks) {
    const key = a.opusSubmissionId?.trim()
      ? `submission:${a.opusSubmissionId.trim()}`
      : `artwork:${a.id}`;
    touch(a.artistUserId, key, true);
  }

  const out = new Map<string, ArtistArtworkMetrics>();
  for (const [userId, b] of buckets) {
    out.set(userId, {
      registrations: b.registrations.size,
      approved: b.approved.size,
    });
  }
  return out;
}

/**
 * Approved artwork count per artist user id (operator 「작품수」 column).
 */
export async function countArtworkRegistrationsByArtistId(): Promise<Map<string, number>> {
  const metrics = await countArtistArtworkMetricsByUserId();
  const out = new Map<string, number>();
  for (const [userId, m] of metrics) {
    out.set(userId, m.approved);
  }
  return out;
}
