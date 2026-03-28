import { NextRequest, NextResponse } from "next/server";
import { readActorFromRequest } from "@/lib/authContext";
import { getSubmissionById, transferOwnershipToCollector } from "@/lib/privateStorage";

export const runtime = "nodejs";

type Body = {
  submissionId?: string;
  buyerId?: string;
};

/**
 * ISO 27001 / OPUS Security Coding Standards
 * - A.9.2.1 (§4), A.12.4.1 (§5), A.13.1.3 (§6)
 *   KO: 판매 정산 API는 운영자 역할만 허용하고, 소유권 이전 이벤트를 기록하며, 실패 시 민감한 내부 정보를 반환하지 않습니다.
 *   JA: 販売精算APIは運営者ロールのみ許可し、所有権移転イベントを記録し、失敗時に機密内部情報を返しません。
 *   EN: Sale settlement API is operator-only, records ownership transfer events, and returns no sensitive internal details on failure.
 */
export async function POST(request: NextRequest) {
  const actor = readActorFromRequest(request);
  if (!actor || actor.role !== "operator") {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  const submissionId = body.submissionId?.trim() ?? "";
  const buyerId = body.buyerId?.trim() ?? "";
  if (!submissionId || !buyerId) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  const submission = await getSubmissionById(submissionId);
  if (!submission) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  try {
    const moved = await transferOwnershipToCollector({ submission, buyerId });
    return NextResponse.json({ ok: true, submissionId, buyerId, storedAt: moved.toRelativePath }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, error: "transfer_failed" }, { status: 400 });
  }
}

