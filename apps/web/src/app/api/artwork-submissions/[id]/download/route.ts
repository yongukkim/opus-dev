import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { readActorFromRequest } from "@/lib/authContext";
import { canAccessSubmission, getCurrentOwner, getSubmissionById } from "@/lib/privateStorage";

export const runtime = "nodejs";

/**
 * ISO 27001 / OPUS Security Coding Standards
 * - A.9.2.1 (§4), A.13.1.3 (§6), A.18.1.4 (§7)
 *   KO: 다운로드는 권한 검증 후에만 허용하며(작가 본인/운영자/구매자), 실패 시 내부 경로·시스템 정보를 노출하지 않습니다.
 *   JA: ダウンロードは権限検証後のみ許可し（本人作家/運営者/購入者）、失敗時に内部パスやシステム情報を露出しません。
 *   EN: Downloads require authorization (artist self/operator/current buyer); failures never disclose internal paths or system details.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const actor = readActorFromRequest(request);
  if (!actor) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const submission = await getSubmissionById(id);
  if (!submission) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const owner = await getCurrentOwner(submission.id, submission.artistId);
  if (!canAccessSubmission(actor, submission, owner)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  try {
    const abs = path.join(process.cwd(), "storage", submission.storedFile.relativePath);
    const buf = await readFile(abs);
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": submission.storedFile.mime,
        "Content-Disposition": `inline; filename="${submission.storedFile.filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
}

