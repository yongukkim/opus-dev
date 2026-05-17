import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { listOpenCollectorTransferListings } from "@/lib/collectorTransferListings";
import { authorizeInternalOperatorRequest } from "@/lib/internalOperatorGate";

export const runtime = "nodejs";

export type OperatorProvenanceListingRow = {
  id: string;
  createdAt: string;
  artworkTitle: string;
  artistPenName: string;
  saleMode: "auction" | "fixed";
  priceJpy: number;
  editionRef: string;
  sellerId: string;
  sourceSubmissionId: string | null;
  auctionEndAt: string | null;
};

/**
 * ISO 27001 A.9.2.1 / A.13.1.3 — Open provenance listings for operator console drill-down.
 * KO: 콘솔 전용 비밀·OPERATOR 검증 하에 공개 중인 소장품(来歴) 등록 목록만 반환한다.
 * JA: コンソール専用シークレットとOPERATOR検証のもと、公開中の来歴出品一覧のみを返す。
 * EN: Under console-only secret + OPERATOR check, return open provenance listing rows only.
 */
export async function GET(req: NextRequest): Promise<Response> {
  const gate = await authorizeInternalOperatorRequest(req);
  if (!gate.ok) {
    return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  }

  const saleModeParam = req.nextUrl.searchParams.get("saleMode")?.trim().toLowerCase();
  const saleModeFilter = saleModeParam === "auction" ? "auction" : saleModeParam === "fixed" ? "fixed" : null;

  const listings = await listOpenCollectorTransferListings();
  const filtered = saleModeFilter ? listings.filter((r) => r.saleMode === saleModeFilter) : listings;

  const rows: OperatorProvenanceListingRow[] = filtered.map((r) => ({
    id: r.id,
    createdAt: r.createdAt,
    artworkTitle: r.artworkTitle,
    artistPenName: r.artistPenName,
    saleMode: r.saleMode,
    priceJpy: r.priceJpy,
    editionRef: r.editionRef,
    sellerId: r.sellerId,
    sourceSubmissionId: r.sourceSubmissionId ?? null,
    auctionEndAt: r.auction?.endAt ?? null,
  }));

  return NextResponse.json({ ok: true, listings: rows, total: rows.length });
}
