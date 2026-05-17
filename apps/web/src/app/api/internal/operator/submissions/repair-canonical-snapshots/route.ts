import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authorizeInternalOperatorRequest } from "@/lib/internalOperatorGate";
import { repairCanonicalSubmissionLedgerSnapshots } from "@/lib/privateStorage";

export const runtime = "nodejs";

/**
 * ISO 27001 A.9.2.1 (§4) / A.12.4.1 (§5)
 * KO: OPERATOR 전용 — 제출 원장에 작가 최초 작품명이 담긴 완전 스냅샷을 append해 표시·인증서 발행 기준을 맞춥니다.
 * JA: OPERATOR 専用 — 作家初回作品名を含む完全スナップショットを原簿へ追記し、表示・認証書基準を揃えます。
 * EN: OPERATOR-only: append full snapshots with the first artist title to align ledger display and certificate issuance.
 *
 * Query: `dryRun=1` — count only, no writes.
 */
export async function POST(req: NextRequest): Promise<Response> {
  const gate = await authorizeInternalOperatorRequest(req);
  if (!gate.ok) {
    return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  }

  const dryRun = req.nextUrl.searchParams.get("dryRun") === "1";
  const result = await repairCanonicalSubmissionLedgerSnapshots(dryRun);

  return NextResponse.json({ ok: true, ...result });
}
