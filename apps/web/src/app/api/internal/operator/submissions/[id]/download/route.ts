import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { authorizeInternalOperatorRequest } from "@/lib/internalOperatorGate";
import { resolveStorageRelativeFile } from "@/lib/ledgerStores";
import { getSubmissionById } from "@/lib/privateStorage";

export const runtime = "nodejs";

/**
 * ISO 27001 A.9.2.1 / A.13.1.3 — Operator asset preview for the console app (no browser cookie to storefront).
 * KO: 콘솔 전용 내부 경로로만 원본 파일을 스트리밍하고, acting 운영자를 DB에서 재검증합니다.
 * JA: コンソール専用内部パスのみで原本をストリーミングし、acting運営者をDBで再検証する。
 * EN: Stream the binary only via the console-internal path with DB-verified acting operators.
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
  if (!submission) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  try {
    const abs = resolveStorageRelativeFile(submission.storedFile.relativePath);
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
