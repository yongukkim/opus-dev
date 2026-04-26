import { NextRequest, NextResponse } from "next/server";
import { readActorFromRequest } from "@/lib/authContext";
import { parseEditionObject } from "@/lib/editionFields";
import {
  appendSubmission,
  getSubmissionById,
  type SubmissionRecord,
} from "@/lib/privateStorage";

export const runtime = "nodejs";

/**
 * ISO 27001 / OPUS Security Coding Standards
 * - A.9.2.1 (§4) Least Privilege RBAC
 *   KO: 에디션 필드 갱신은 해당 제출의 작가 세션만 허용하고, 검수 승인·거절 후에는 변경할 수 없게 합니다.
 *   JA: エディション更新は当該提出の作家セッションのみ許可し、審査承認・却下後は変更不可とします。
 *   EN: Edition updates are allowed only for the owning artist session and are blocked after approval or rejection.
 *
 * - A.14.2.1 (§1) Input Validation & Sanitization
 *   KO: JSON 본문의 에디션 필드는 열거·범위(총수 ≤ 20, unique 시 1/1)를 화이트리스트로 검증합니다.
 *   JA: JSON本文のエディションは列挙・範囲（総数 ≤ 20、ユニーク時は 1/1）をホワイトリスト検証します。
 *   EN: Validate edition fields from JSON with allowlists and bounds (total ≤ 20; unique forces 1/1).
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const actor = await readActorFromRequest(request);
  if (!actor || actor.role !== "artist") {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const submission = await getSubmissionById(id);
  if (!submission) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  if (submission.artistId !== actor.userId) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const status: NonNullable<SubmissionRecord["reviewStatus"]> =
    submission.reviewStatus ?? "pending_review";
  if (status !== "pending_review" && status !== "changes_requested") {
    return NextResponse.json({ ok: false, error: "edition_locked" }, { status: 409 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = parseEditionObject(body);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  const next: SubmissionRecord = {
    ...submission,
    editionMode: parsed.value.editionMode,
    editionTotal: parsed.value.editionTotal,
    initialMint: parsed.value.initialMint,
    numberingPolicy: parsed.value.numberingPolicy,
    lockEdition: parsed.value.lockEdition,
  };

  await appendSubmission(next);
  return NextResponse.json({ ok: true });
}
