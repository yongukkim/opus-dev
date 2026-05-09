import { NextRequest, NextResponse } from "next/server";
import { readActorFromRequest } from "@/lib/authContext";
import { isLikelyMobileWebClient } from "@/lib/mobileUserAgent";
import { appendViewerTileSessionAudit } from "@/lib/viewerTileAudit";
import { signViewerTileSessionToken } from "@/lib/viewerTileSession";
import { canAccessSubmission, getCurrentOwner, getSubmissionById } from "@/lib/privateStorage";

export const runtime = "nodejs";

type Body = { submissionId?: string };

/**
 * ISO 27001 A.9.2.1 (§4) / A.12.4.1 (§5) / A.13.1.3 (§6) / A.18.1.4 (§7)
 * KO: 고해상 타일 세션 토큰은 모바일 웹 클라이언트·소유/접근 권한을 만족할 때만 발급하고, 성공/거절을 최소 감사 로그에 남깁니다.
 * JA: 高解像タイルセッションはモバイルWebかつ権限がある場合のみ発行し、結果を最小監査ログに記録します。
 * EN: Issue tile-session tokens only for mobile web clients with custody/access rights; append minimal audit outcomes.
 */
export async function POST(request: NextRequest): Promise<Response> {
  const mobile = isLikelyMobileWebClient(request.headers.get("user-agent"), request.headers.get("sec-ch-ua-mobile"));
  const clientClass = mobile ? ("mobile_web" as const) : ("unknown" as const);

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  const submissionId = body.submissionId?.trim() ?? "";
  if (!submissionId) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  const actor = await readActorFromRequest(request);
  if (!actor?.userId) {
    await appendViewerTileSessionAudit({
      userId: "anonymous",
      submissionId,
      clientClass,
      outcome: "denied_forbidden",
    });
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  if (!mobile) {
    await appendViewerTileSessionAudit({
      userId: actor.userId,
      submissionId,
      clientClass,
      outcome: "denied_mobile_required",
    });
    return NextResponse.json({ ok: false, error: "mobile_client_required" }, { status: 403 });
  }

  const submission = await getSubmissionById(submissionId);
  if (!submission || (submission.reviewStatus ?? "pending_review") !== "approved") {
    await appendViewerTileSessionAudit({
      userId: actor.userId,
      submissionId,
      clientClass,
      outcome: "denied_forbidden",
    });
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const owner = await getCurrentOwner(submission.id, submission.artistId);
  if (!canAccessSubmission(actor, submission, owner)) {
    await appendViewerTileSessionAudit({
      userId: actor.userId,
      submissionId,
      clientClass,
      outcome: "denied_forbidden",
    });
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const token = signViewerTileSessionToken(actor.userId, submissionId);
  await appendViewerTileSessionAudit({
    userId: actor.userId,
    submissionId,
    clientClass,
    outcome: "issued",
  });

  return NextResponse.json(
    {
      ok: true,
      token,
      note: "Milestone: token issued; IIIF/tiled endpoint wiring is the next step.",
    },
    { status: 200 },
  );
}
