import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { renderSubmissionPublicPreviewWatermarked } from "@/lib/catalogImageServe";
import { authorizeInternalOperatorRequest } from "@/lib/internalOperatorGate";
import { resolveStorageRelativeFile } from "@/lib/ledgerStores";
import { getSubmissionById } from "@/lib/privateStorage";

export const runtime = "nodejs";

/**
 * ISO 27001 A.9.2.1 (§4) RBAC · A.13.1.3 (§6) API security
 * KO: 콘솔 운영자만 제출물 미리보기(워터마크 WebP 파생)를 받으며, 철회된 제출은 제외합니다.
 * JA: コンソール運営者のみ提出物プレビュー（透かしWebP派生）を取得し、取り下げ済みは除外します。
 * EN: Console operators only receive watermarked WebP previews; withdrawn submissions are excluded.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const gate = await authorizeInternalOperatorRequest(req);
  if (!gate.ok) {
    return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  }

  const { id } = await context.params;
  const submission = await getSubmissionById(id);
  if (!submission || (submission.reviewStatus ?? "pending_review") === "withdrawn") {
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
        "Cache-Control": "private, max-age=600, stale-while-revalidate=1800",
        "X-Robots-Tag": "noindex, noimageindex",
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "processing_failed" }, { status: 500 });
  }
}
