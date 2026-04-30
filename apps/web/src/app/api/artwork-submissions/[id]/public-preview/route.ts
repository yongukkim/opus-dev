import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { renderSubmissionPublicPreviewWatermarked } from "@/lib/catalogImageServe";
import { resolveStorageRelativeFile } from "@/lib/ledgerStores";
import { getSubmissionById } from "@/lib/privateStorage";

export const runtime = "nodejs";

/**
 * ISO 27001 A.9.2.1 (§4) RBAC / exposure boundary · A.13.1.3 (§6) API security
 * KO: 공개 미리보기는 승인된 제출물만 반환하고 원본 대신 워터마크 파생(WebP)만 제공합니다.
 * JA: 公開プレビューは承認済み提出物のみ返し、原本ではなく透かし入り派生(WebP)のみ提供します。
 * EN: Public previews are limited to approved submissions and serve only watermarked derivatives (WebP), never raw masters.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  const submission = await getSubmissionById(id);
  if (!submission || (submission.reviewStatus ?? "pending_review") !== "approved") {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  let absPath: string;
  try {
    absPath = resolveStorageRelativeFile(submission.storedFile.relativePath);
    await readFile(absPath);
  } catch {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  try {
    const body = await renderSubmissionPublicPreviewWatermarked(absPath, submission.storedFile.mime);
    return new NextResponse(new Uint8Array(body), {
      status: 200,
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=1800, stale-while-revalidate=86400",
        "X-Robots-Tag": "noindex, noimageindex",
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "processing_failed" }, { status: 500 });
  }
}
