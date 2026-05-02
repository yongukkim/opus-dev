import { NextRequest, NextResponse } from "next/server";
import { authorizeInternalOperatorRequest } from "@/lib/internalOperatorGate";
import { runOperatorSubmissionReview } from "@/lib/operatorSubmissionReview";

export const runtime = "nodejs";

/**
 * ISO 27001 A.9.2.1 / A.13.1.3 — Same mutation as `/api/operator/submissions/[id]/review` for the console app (S2S).
 * KO: 콘솔이 공유 비밀으로 호출하되 reviewerId는 헤더의 운영자 ID로 고정해 감사 추적을 유지합니다.
 * JA: コンソールが共有シークレットで呼び出すが、reviewerIdはヘッダの運営者IDで固定し監査追跡を維持する。
 * EN: Console calls with the shared secret; reviewerId is the acting operator from headers for audit consistency.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const gate = await authorizeInternalOperatorRequest(request);
  if (!gate.ok) {
    return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  }

  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  const result = await runOperatorSubmissionReview({
    reviewerId: gate.actingUserId,
    submissionId: id,
    body,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true });
}
