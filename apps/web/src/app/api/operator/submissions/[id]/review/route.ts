import { NextRequest, NextResponse } from "next/server";
import { readActorFromRequest } from "@/lib/authContext";
import {
  appendSubmissionReviewPatch,
  getSubmissionById,
  type SubmissionRecord,
} from "@/lib/privateStorage";
import { hasOperatorSessionFromCookies } from "@/lib/operatorSession";

export const runtime = "nodejs";

type ReviewStatus = NonNullable<SubmissionRecord["reviewStatus"]>;
type ContentRating = NonNullable<SubmissionRecord["contentRating"]>;

/**
 * ISO 27001 / OPUS Security Coding Standards
 * - A.9.2.1 (§4) Least Privilege RBAC
 *   KO: 검수 상태 변경은 운영자만 수행할 수 있으며, 데모 단계에서는 운영자 세션 쿠키로 접근을 제한합니다.
 *   JA: 審査ステータス変更は運営者のみが実行でき、デモ段階では運営者セッションクッキーでアクセスを制限します。
 *   EN: Review status changes are restricted to operators; in demo mode we gate via an operator session cookie.
 *
 * - A.14.2.1 (§1) Input validation
 *   KO: reviewStatus/contentRating/note는 허용 값만 수용하고 길이를 제한합니다.
 *   JA: reviewStatus/contentRating/noteは許可値のみ受け付け、長さを制限します。
 *   EN: reviewStatus/contentRating/note accept allowlisted values only with length bounds.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const cookieStore = request.cookies;
  if (!hasOperatorSessionFromCookies(cookieStore)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // Optional hardening for internal tooling: if actor headers exist, enforce operator role.
  const actor = readActorFromRequest(request);
  if (actor && actor.role !== "operator") {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
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

  const parsed = body as Partial<{ reviewStatus: ReviewStatus; contentRating: ContentRating; reviewNote: string }>;
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

  await appendSubmissionReviewPatch({
    submission,
    reviewerId: actor?.userId ?? "operator-demo",
    reviewStatus: normalizedStatus,
    contentRating,
    reviewNote,
  });

  return NextResponse.json({ ok: true });
}

