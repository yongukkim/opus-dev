import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auditIssuedEditionLedgerBindings } from "@/lib/editionLedgerBinding";
import { authorizeInternalOperatorRequest } from "@/lib/internalOperatorGate";

export const runtime = "nodejs";

/**
 * ISO 27001 A.9.2.1 (§4) / A.12.4.1 (§5)
 * KO: 발행 에디션별 `opusSubmissionId` 연결·원장 작품명 일치 여부를 OPERATOR에게 보고합니다(추측 없음).
 * JA: 発行エディションごとの `opusSubmissionId` 連結と原簿作品名を OPERATOR に報告します（推測なし）。
 * EN: Report per issued edition whether `opusSubmissionId` is set and which ledger title applies (no inference).
 */
export async function GET(req: NextRequest): Promise<Response> {
  const gate = await authorizeInternalOperatorRequest(req);
  if (!gate.ok) {
    return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  }

  const audit = await auditIssuedEditionLedgerBindings();
  return NextResponse.json({ ok: true, ...audit });
}
