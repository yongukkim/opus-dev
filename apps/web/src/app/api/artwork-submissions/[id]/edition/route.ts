import { NextRequest, NextResponse } from "next/server";
import { readActorFromRequest } from "@/lib/authContext";
import { parseEditionObject } from "@/lib/editionFields";
import {
  appendSubmission,
  getSubmissionById,
  hasCollectorOwnershipEvent,
  SubmissionLedgerValidationError,
  type SubmissionRecord,
} from "@/lib/privateStorage";

export const runtime = "nodejs";

/**
 * ISO 27001 / OPUS Security Coding Standards
 * - A.9.2.1 (§4) Least Privilege RBAC
 *   KO: 에디션 필드 갱신은 해당 제출의 작가 세션만 허용하고, 검수 승인·거절 후 또는 컬렉터 소유 이력이 1회라도 생기면 변경을 차단합니다.
 *   JA: エディション更新は当該提出の作家セッションのみ許可し、審査承認・却下後またはコレクター所蔵履歴が1回でもある場合は変更を禁止します。
 *   EN: Edition updates are allowed only for the owning artist session and are blocked after approval/rejection or any collector ownership event.
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
  if (status === "withdrawn") {
    return NextResponse.json({ ok: false, error: "edition_locked" }, { status: 409 });
  }
  if (status !== "pending_review" && status !== "changes_requested") {
    return NextResponse.json({ ok: false, error: "edition_locked" }, { status: 409 });
  }
  if (await hasCollectorOwnershipEvent(submission.id)) {
    return NextResponse.json({ ok: false, error: "edition_locked_after_sale" }, { status: 409 });
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

  try {
    await appendSubmission(next);
  } catch (e) {
    if (e instanceof SubmissionLedgerValidationError) {
      return NextResponse.json(
        { ok: false, error: "submission_identity_incomplete", fields: e.missingFields },
        { status: 422 },
      );
    }
    throw e;
  }
  return NextResponse.json({ ok: true });
}
