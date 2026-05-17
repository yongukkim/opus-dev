import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authorizeInternalOperatorRequest } from "@/lib/internalOperatorGate";
import { applyArtworkOpusSubmissionBackfill } from "@/lib/editionLedgerBinding";

export const runtime = "nodejs";

/**
 * ISO 27001 A.9.2.1 (§4) / A.12.4.1 (§5) / A.13.1.3 (§6)
 * KO: OPERATOR 전용 — 발행 인증서가 모든 에디션 슬롯을 증명할 때만 `opusSubmissionId`를 영구 연결합니다(추측 금지).
 * JA: OPERATOR 専用 — 発行認証書が全エディションスロットを証明するときのみ `opusSubmissionId` を永続リンクします（推測禁止）。
 * EN: OPERATOR-only: set `opusSubmissionId` only when issued certificates prove every edition slot (no inference).
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
