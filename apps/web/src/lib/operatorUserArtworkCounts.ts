import { listAllSubmissions } from "@/lib/privateStorage";

/**
 * Distinct submission registrations per artist user id (latest row per submission id, same basis as dashboard artworks KPI).
 * KO: 제출 원장 기준 작가별 작품 등록 건수를 집계한다.
 * JA: 提出原簿に基づき作家ユーザーIDごとの作品登録件数を集計する。
 * EN: Count artwork registrations per artist user id from the submissions ledger.
 */
export async function countArtworkRegistrationsByArtistId(): Promise<Map<string, number>> {
  const submissions = await listAllSubmissions();
  const counts = new Map<string, number>();
  for (const s of submissions) {
    const artistId = s.artistId?.trim();
    if (!artistId) continue;
    counts.set(artistId, (counts.get(artistId) ?? 0) + 1);
  }
  return counts;
}
