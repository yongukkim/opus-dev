import { NextRequest, NextResponse } from "next/server";
import { issueMobileAuthFromGoogleIdToken } from "@/lib/mobileGoogleIdTokenAuth";

export const runtime = "nodejs";

/**
 * Mobile-app Google OAuth token exchange.
 *
 * ISO 27001 A.9.4.2 / A.13.1.3 (CLAUDE.md §2, §6)
 * KO: Google id_token을 검증하고 앱 전용 access/refresh Bearer 토큰을 발급한다. 쿠키 세션 없는 네이티브 클라이언트 전용.
 * JA: Google id_token を検証し、アプリ専用 access/refresh Bearer トークンを発行する。ネイティブクライアント専用。
 * EN: Validates Google id_token and issues app-specific access/refresh Bearer tokens for native clients.
 */
export async function POST(req: NextRequest): Promise<Response> {
  let body: { idToken?: string } | null = null;
  try {
    body = (await req.json()) as { idToken?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const idToken = body?.idToken?.trim();
  if (!idToken) {
    return NextResponse.json({ ok: false, error: "id_token_required" }, { status: 400 });
  }

  const result = await issueMobileAuthFromGoogleIdToken(idToken);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json(
    {
      ok: true,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
      user: result.user,
    },
    {
      status: 200,
      headers: { "X-Robots-Tag": "noindex" },
    },
  );
}
