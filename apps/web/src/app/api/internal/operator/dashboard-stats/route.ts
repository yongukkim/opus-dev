import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { listOpenCollectorTransferListings } from "@/lib/collectorTransferListings";
import { authorizeInternalOperatorRequest } from "@/lib/internalOperatorGate";
import { prisma } from "@/lib/prisma";
import { listAllSubmissions } from "@/lib/privateStorage";

export const runtime = "nodejs";

export type OperatorDashboardStats = {
  membersTotal: number;
  artistsTotal: number;
  artworksTotal: number;
  provenanceAuctionsTotal: number;
  provenanceFixedPriceTotal: number;
};

/**
 * ISO 27001 A.9.2.1 / A.13.1.3 — Aggregate counts for the operator console dashboard only.
 * KO: 콘솔 전용 비밀·OPERATOR 검증 하에 회원·제출·来歴 리스팅 건수만 집계해 반환한다(PII 목록 없음).
 * JA: コンソール専用シークレットとOPERATOR検証のもと、会員・提出・来歴出品件数のみを集計して返す（PII一覧なし）。
 * EN: Under console-only secret + OPERATOR check, return aggregate counts only (no PII listings).
 */
export async function GET(req: NextRequest): Promise<Response> {
  const gate = await authorizeInternalOperatorRequest(req);
  if (!gate.ok) {
    return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  }

  const [membersTotal, artistsTotal, submissions, listings] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "ARTIST" } }),
    listAllSubmissions(),
    listOpenCollectorTransferListings(),
  ]);

  const artworksTotal = submissions.length;
  let provenanceAuctionsTotal = 0;
  let provenanceFixedPriceTotal = 0;
  for (const row of listings) {
    if (row.saleMode === "auction") provenanceAuctionsTotal += 1;
    else provenanceFixedPriceTotal += 1;
  }

  const stats: OperatorDashboardStats = {
    membersTotal,
    artistsTotal,
    artworksTotal,
    provenanceAuctionsTotal,
    provenanceFixedPriceTotal,
  };

  return NextResponse.json({ ok: true, stats });
}
