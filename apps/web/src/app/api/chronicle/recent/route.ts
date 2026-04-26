import { NextResponse } from "next/server";
import { listPublicChroniclePreviewRows } from "@/lib/chronicleLedger";

export const runtime = "nodejs";

/**
 * ISO 27001 A.12.4.1 (§5), A.18.1.4 (§7)
 * KO: 공개 Chronicle 미리보기는 사용자 ID를 마스킹한 투영만 반환합니다.
 * JA: 公開ChronicleプレビューはユーザーIDをマスクした射影のみを返します。
 * EN: Public Chronicle preview returns only masked user-id projections.
 */
export async function GET(): Promise<Response> {
  const entries = await listPublicChroniclePreviewRows(5);
  return NextResponse.json(
    { ok: true, entries },
    { status: 200, headers: { "Cache-Control": "private, max-age=30" } },
  );
}
