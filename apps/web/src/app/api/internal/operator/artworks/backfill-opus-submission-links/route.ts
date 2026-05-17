import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authorizeInternalOperatorRequest } from "@/lib/internalOperatorGate";
import { applyArtworkOpusSubmissionBackfill } from "@/lib/operatorEditionSubmissionLink";

export const runtime = "nodejs";

/**
 * ISO 27001 A.9.2.1 (§4) / A.12.4.1 (§5) / A.13.1.3 (§6)
 * KO: OPERATOR 전용으로 Prisma `Artwork.opusSubmissionId`가 비어 있을 때 JSONL·인증서 근거로 고유 매칭만 영구 연결한다.
 * JA: OPERATOR 専用で Prisma の `opusSubmissionId` 欠損を、提出原簿・認証書に基づく一意照合のみで永続リンクする。
 * EN: OPERATOR-only: persist `Artwork.opusSubmissionId` when uniquely inferable from ledger/certificate data.
 *
 * Query: `dryRun=1` — report candidates without writing.
 */
export async function POST(req: NextRequest): Promise<Response> {
  const gate = await authorizeInternalOperatorRequest(req);
  if (!gate.ok) {
    return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  }

  const dryRun = req.nextUrl.searchParams.get("dryRun") === "1";
  const result = await applyArtworkOpusSubmissionBackfill(dryRun);

  return NextResponse.json({ ok: true, ...result });
}
