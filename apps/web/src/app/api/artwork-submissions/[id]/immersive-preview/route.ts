import { readFile } from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { readActorFromRequest } from "@/lib/authContext";
import { renderSubmissionImmersiveOwnerPreview } from "@/lib/catalogImageServe";
import { isLikelyMobileWebClient } from "@/lib/mobileUserAgent";
import { resolveStorageRelativeFile } from "@/lib/ledgerStores";
import {
  canAccessSubmission,
  getCurrentOwner,
  getSubmissionById,
} from "@/lib/privateStorage";

export const runtime = "nodejs";

/**
 * ISO 27001 A.9.2.1 (§4) / A.13.1.3 (§6) / A.18.1.4 (§7)
 * KO: 몰입 감상용 워터마크 파생은 모바일 웹·세션·소유/접근 권한을 만족할 때만 반환합니다.
 * JA: 没入鑑賞用の透かし派生はモバイルWeb・セッション・権限がある場合のみ返します。
 * EN: Immersive watermarked derivatives are served only to mobile web sessions with custody/access rights.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const mobile = isLikelyMobileWebClient(
    request.headers.get("user-agent"),
    request.headers.get("sec-ch-ua-mobile"),
  );
  if (!mobile) {
    return NextResponse.json({ ok: false, error: "mobile_client_required" }, { status: 403 });
  }

  const actor = await readActorFromRequest(request);
  if (!actor) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const submission = await getSubmissionById(id);
  if (!submission || (submission.reviewStatus ?? "pending_review") !== "approved") {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const owner = await getCurrentOwner(submission.id, submission.artistId);
  if (!canAccessSubmission(actor, submission, owner)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const tierRaw = request.nextUrl.searchParams.get("tier")?.trim().toLowerCase() ?? "";
  const tier = tierRaw === "zoom" ? ("zoom" as const) : ("fit" as const);

  let absPath: string;
  try {
    absPath = resolveStorageRelativeFile(submission.storedFile.relativePath);
    await readFile(absPath);
  } catch {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  try {
    const body = await renderSubmissionImmersiveOwnerPreview(absPath, submission.storedFile.mime, tier);
    return new NextResponse(new Uint8Array(body), {
      status: 200,
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex, noimageindex",
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "processing_failed" }, { status: 500 });
  }
}
