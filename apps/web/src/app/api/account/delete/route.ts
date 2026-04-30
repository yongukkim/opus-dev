import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * ISO 27001 A.9.4.2 (§2), A.14.2.1 (§1), A.18.1.4 (§7)
 * KO: 인증된 본인 세션에서만 탈퇴를 허용하며, 확인 토큰을 검증한 뒤 계정을 삭제해 오동작과 무단 삭제를 방지합니다.
 * JA: 認証済み本人セッションのみ退会を許可し、確認トークン検証後に削除して誤操作と不正削除を防止します。
 * EN: Only authenticated self-session can delete the account; a confirmation token is validated before deletion.
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const confirmText = typeof payload["confirmText"] === "string" ? payload["confirmText"].trim() : "";
  if (confirmText !== "DELETE") {
    return NextResponse.json({ ok: false, error: "invalid_confirmation" }, { status: 400 });
  }

  try {
    await prisma.user.delete({
      where: { id: session.user.id },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "delete_failed" }, { status: 500 });
  }
}
