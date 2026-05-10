import { NextResponse, type NextRequest } from "next/server";
import { readActorFromRequest } from "@/lib/authContext";
import {
  canAccessSubmission,
  getCurrentOwner,
  getSubmissionById,
} from "@/lib/privateStorage";
import {
  ensureEditionCertificatesBackfill,
  getLatestEditionCertificate,
  verifyEditionCertificateRecord,
} from "@/lib/editionCertificate";

export const runtime = "nodejs";

/**
 * ISO 27001 A.9.2.1 (§4) / A.12.4.1 (§5) / A.13.1.3 (§6)
 * KO: 에디션 인증서 JSON은 소유자·해당 작가·운영자만 내려받을 수 있으며, 응답에 서명 검증 결과를 포함합니다.
 * JA: エディション認証書JSONは所有者・当該作家・運営のみが取得でき、署名検証結果を含めます。
 * EN: Edition certificate JSON is available to the custodian, the registering artist, or operators; responses include signature verification.
 */
export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ submissionId: string; editionNumber: string }> },
): Promise<Response> {
  const { submissionId: rawSid, editionNumber: edRaw } = await ctx.params;
  const submissionId = rawSid?.trim() ?? "";
  const editionNum = Number.parseInt(edRaw ?? "", 10);
  if (!submissionId || !Number.isFinite(editionNum) || editionNum < 1) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  const actor = await readActorFromRequest(_request);
  if (!actor) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const submission = await getSubmissionById(submissionId);
  if (!submission) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  if (
    (submission.reviewStatus ?? "pending_review") === "withdrawn" &&
    actor.role !== "operator"
  ) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const owner = await getCurrentOwner(submission.id, submission.artistId);
  if (!canAccessSubmission(actor, submission, owner)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  let cert = await getLatestEditionCertificate(submissionId, editionNum);
  if (
    !cert &&
    submission.reviewStatus === "approved" &&
    editionNum >= 1 &&
    editionNum <= submission.initialMint
  ) {
    await ensureEditionCertificatesBackfill(submission);
    cert = await getLatestEditionCertificate(submissionId, editionNum);
  }
  if (!cert) {
    return NextResponse.json({ ok: false, error: "certificate_not_found" }, { status: 404 });
  }

  const verified = verifyEditionCertificateRecord(cert);
  const body = { ok: true as const, verified, certificate: cert };
  const filename = `opus-edition-certificate-${submissionId}-e${editionNum}-v${cert.version}.json`;

  return new NextResponse(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
