import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { OPUS_VAULT_UI_ROLE_COOKIE, type VaultUiRole } from "@/lib/vaultRole";

export const runtime = "nodejs";

/**
 * ISO 27001 A.9.2.1 (§4) RBAC · A.14.2.1 (§1) Input validation · A.13.1.3 (§6) API security
 * KO: Vault UI 역할 쿠키는 세션에서 작가로 인증된 사용자만 변경할 수 있어 권한 상승을 막습니다.
 * JA: Vault UIの役割クッキーはセッション上の作家のみが変更でき、権限昇格を防ぎます。
 * EN: Only session-authenticated artists may set the vault UI role cookie, preventing privilege escalation.
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "artist") {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }
  const role = (body as Record<string, unknown>)["role"];
  if (role !== "artist" && role !== "collector") {
    return NextResponse.json({ ok: false, error: "invalid_role" }, { status: 400 });
  }

  const jar = await cookies();
  jar.set(OPUS_VAULT_UI_ROLE_COOKIE, role as VaultUiRole, {
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });

  return NextResponse.json({ ok: true, role } satisfies { ok: true; role: VaultUiRole });
}
