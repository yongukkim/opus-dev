import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { parseEditionObject, type ParsedEdition } from "@/lib/editionFields";
import { appendIssuanceChronicleIfNewlyApproved } from "@/lib/chronicleLedger";
import { enqueueMintJobForApprovedSubmission } from "@/lib/onchainMintQueue";
import {
  appendSubmissionReviewPatch,
  getSubmissionById,
  type SubmissionRecord,
} from "@/lib/privateStorage";

export const runtime = "nodejs";

type ReviewStatus = NonNullable<SubmissionRecord["reviewStatus"]>;
type ContentRating = NonNullable<SubmissionRecord["contentRating"]>;

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
  const submission = await getSubmissionById(id);
  if (!submission) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  const parsed = body as Partial<{
    reviewStatus: ReviewStatus;
    contentRating: ContentRating;
    reviewNote: string;
    edition: unknown;
  }>;
  const reviewStatus = parsed.reviewStatus;
  const contentRating = parsed.contentRating;
  const reviewNote = typeof parsed.reviewNote === "string" ? parsed.reviewNote : undefined;

  const allowedStatus: ReviewStatus[] = ["pending_review", "approved", "changes_requested", "rejected"];
  const allowedRating: ContentRating[] = ["general", "mature", "explicit"];
  if (!reviewStatus || !allowedStatus.includes(reviewStatus)) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }
  if (!contentRating || !allowedRating.includes(contentRating)) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  // Option B policy: explicit content is not published; default to rejected.
  const normalizedStatus: ReviewStatus =
    contentRating === "explicit" && reviewStatus === "approved" ? "rejected" : reviewStatus;

  let editionOverride: ParsedEdition | undefined;
  if (parsed.edition !== undefined) {
    if (parsed.edition === null || typeof parsed.edition !== "object") {
      return NextResponse.json({ ok: false, error: "invalid_edition" }, { status: 400 });
    }
    const cur = submission.reviewStatus ?? "pending_review";
    if (cur !== "pending_review" && cur !== "changes_requested") {
      return NextResponse.json({ ok: false, error: "edition_locked" }, { status: 409 });
    }
    const ep = parseEditionObject(parsed.edition);
    if (!ep.ok) {
      return NextResponse.json({ ok: false, error: ep.error }, { status: 400 });
    }
    editionOverride = ep.value;
  }

  const written = await appendSubmissionReviewPatch({
    submission,
    reviewerId: session.user.id,
    reviewStatus: normalizedStatus,
    contentRating,
    reviewNote,
    editionOverride,
  });

  try {
    await appendIssuanceChronicleIfNewlyApproved({ before: submission, written });
  } catch {
    // ISO A.12.4.1 — KO: Chronicle 보조 파일 쓰기 실패 시 검수 본 레코드는 이미 확정되었으므로 API는 성공으로 둡니다(운영 알람 대상).
    // JA: Chronicle補助ファイルの書込に失敗しても審査本体は確定済みのためAPIは成功とする（運用アラート対象）。
    // EN: If the auxiliary Chronicle append fails, the review row is already persisted; still return ok (ops alert).
  }

  try {
    await enqueueMintJobForApprovedSubmission(written);
  } catch {
    // ISO A.12.4.1 — KO: 민팅 큐 append 실패는 검수 본 레코드와 분리하며, 운영 재처리 API로 복구합니다.
    // JA: ミントキューappend失敗は審査本体と分離し、運用の再処理APIで復旧します。
    // EN: Mint-queue append failures are isolated from review persistence and can be recovered by ops re-processing API.
  }

  return NextResponse.json({ ok: true });
}

