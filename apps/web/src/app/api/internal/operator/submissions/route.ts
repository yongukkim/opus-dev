import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authorizeInternalOperatorRequest } from "@/lib/internalOperatorGate";
import { listAllSubmissions } from "@/lib/privateStorage";

export const runtime = "nodejs";

/**
 * ISO 27001 A.9.2.1 / A.13.1.3 — Internal listing for the dedicated operator console (Bearer + acting OPERATOR).
 * KO: 스토어 웹 세션이 아닌 콘솔 서버가 동일 비밀로 호출할 때만 제출 목록을 반환합니다.
 * JA: ストアWebセッションではなくコンソールサーバが同一シークレットで呼ぶ場合のみ提出一覧を返します。
 * EN: Return the submission list only when the console backend calls with the shared secret and an acting operator id.
 */
export async function GET(req: NextRequest): Promise<Response> {
  const gate = await authorizeInternalOperatorRequest(req);
  if (!gate.ok) {
    return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  }
  const rows = await listAllSubmissions();
  return NextResponse.json(rows);
}
