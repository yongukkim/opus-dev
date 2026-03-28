import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getCurrentOwner, getSubmissionById } from "@/lib/privateStorage";

export const runtime = "nodejs";

/**
 * ISO 27001 / OPUS Security Coding Standards
 * - A.9.2.1 (§4), A.13.1.3 (§6)
 *   KO: 작가 본인만(artistId 일치·소유 상태) 미리보기 바이너리를 받도록 제한합니다. 운영 단계에서는 세션·서명 URL로 대체합니다.
 *   JA: 本人作家のみ（artistId一致・所有状態）がプレビュー取得可。本番はセッションや署名URLに置換します。
 *   EN: Restrict preview bytes to the owning artist (artistId match + ownership); replace with session or signed URLs in production.
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const artistId = request.nextUrl.searchParams.get("artistId")?.trim() ?? "";
  if (!artistId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const submission = await getSubmissionById(id);
  if (!submission) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  if (submission.artistId !== artistId) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const owner = await getCurrentOwner(submission.id, submission.artistId);
  if (owner.ownerType !== "artist" || owner.ownerId !== artistId) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  try {
    const abs = path.join(process.cwd(), "storage", submission.storedFile.relativePath);
    const buf = await readFile(abs);
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": submission.storedFile.mime,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
}
