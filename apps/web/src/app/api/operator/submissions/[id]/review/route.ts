import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { runOperatorSubmissionReview } from "@/lib/operatorSubmissionReview";

export const runtime = "nodejs";

/**
 * ISO 27001 / OPUS Security Coding Standards
 * - A.9.2.1 (§4) Least Privilege RBAC
 *   KO: 검수 상태 변경은 DB 기반 OPERATOR 세션만 수행할 수 있도록 제한합니다.
 *   JA: 審査ステータス変更はDBベースのOPERATORセッションのみに制限します。
 *   EN: Review status changes are restricted to DB-backed OPERATOR sessions only.
 *
 * - A.14.2.1 (§1) Input validation
 *   KO: reviewStatus/contentRating/note는 허용 값만 수용하고 길이를 제한합니다. 선택 필드 edition은 검수 대기·수정 요청 상태에서만 동일 규칙으로 병합합니다.
 *   JA: reviewStatus/contentRating/noteは許可値のみ。任意のeditionは審査待ち・修正依頼時のみ同一規則でマージします。
 *   EN: Allowlist reviewStatus/contentRating/note with length bounds; optional edition merges only while pending or changes-requested, under the same edition rules.
 *
 * - A.12.4.1 (§5) Audit trail separation (see `ledgerStores.ts`)
 *   KO: 검수 본기록(`submissions.jsonl`) 확정 후 Chronicle·온체인 큐는 각각 별도 append-only 파일에 기록하며, 보조 단계 실패가 검수 확정을 되돌리지 않습니다.
 *   JA: 審査本体確定後、Chronicleとオンチェーンキューは別append-onlyへ記録し、補助段階の失敗は審査確定を巻き戻しません。
 *   EN: After review persistence, Chronicle + mint queue append to separate ledgers; auxiliary failures do not roll back the review decision.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "operator") {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  const result = await runOperatorSubmissionReview({
    reviewerId: session.user.id,
    submissionId: id,
    body,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true });
}
