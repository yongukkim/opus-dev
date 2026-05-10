import { NextRequest, NextResponse } from "next/server";
import { readActorFromRequest } from "@/lib/authContext";
import { withdrawArtistPendingSubmission } from "@/lib/privateStorage";

export const runtime = "nodejs";

/**
 * ISO 27001 / OPUS Security Coding Standards
 * - A.9.2.1 (§4) Least Privilege RBAC
 *   KO: 검수 대기 제출의 철회는 해당 작가 세션만 수행할 수 있습니다.
 *   JA: 審査待ち提出の取下げは当該作家セッションのみが実行できます。
 *   EN: Only the owning artist session may withdraw a submission while it is pending review.
 *
 * - A.12.4.1 (§5) Audit trail
 *   KO: 철회는 append-only 제출 원장에 `withdrawn` 상태로 기록됩니다.
 *   JA: 取り下げはappend-only提出台帳へ`withdrawn`として記録されます。
 *   EN: Withdrawal is recorded on the append-only submission ledger as `withdrawn`.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const actor = await readActorFromRequest(request);
  if (!actor || actor.role !== "artist") {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const result = await withdrawArtistPendingSubmission({
    submissionId: id,
    artistUserId: actor.userId,
  });

  if (!result.ok) {
    const status =
      result.error === "not_found"
        ? 404
        : result.error === "forbidden"
          ? 403
          : result.error === "after_sale" || result.error === "not_pending" || result.error === "already_withdrawn"
            ? 409
            : 400;
    return NextResponse.json({ ok: false, error: result.error }, { status });
  }
  return NextResponse.json({ ok: true });
}
