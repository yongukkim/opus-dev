import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * ISO 27001 A.9.2.1 (§4), A.12.4.1 (§5), A.18.1.4 (§7)
 * KO: 작가 본인만 제출 가이드 완료 시각을 기록하며, 감사 추적을 위해 서버에서만 갱신한다.
 * JA: 作家本人のみが提出ガイド完了時刻を記録し、監査のためサーバでのみ更新する。
 * EN: Only the signed-in artist may stamp guide completion; server-side audit field only.
 */
export async function POST(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "artist") {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { artistSubmissionGuideCompletedAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "persist_failed" }, { status: 500 });
  }
}
