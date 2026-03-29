import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { OPUS_VAULT_UI_ROLE_COOKIE, type VaultUiRole } from "@/lib/vaultRole";

export const runtime = "nodejs";

/**
 * ISO 27001 A.9.2.1 (§4) RBAC · A.14.2.1 (§1) Input validation
 * KO: Vault UI 역할 쿠키는 artist/collector만 허용하며, 실제 권한은 추후 세션·토큰으로 대체됩니다.
 * JA: Vault UIの役割クッキーはartist/collectorのみ許可し、実権限は将来セッションに移行します。
 * EN: Vault UI role cookie allows only artist/collector; real authorization will move to session tokens.
 */
export async function POST(request: NextRequest) {
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
