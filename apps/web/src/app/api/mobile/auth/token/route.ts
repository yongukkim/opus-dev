import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signMobileAccessToken, signMobileRefreshToken } from "@/lib/mobileAuthToken";

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

  // Verify id_token with Google tokeninfo endpoint.
  type GoogleTokenInfo = { sub: string; email: string; email_verified: string; aud: string };
  let googlePayload: GoogleTokenInfo | null = null;
  try {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: "invalid_id_token" }, { status: 401 });
    }
    googlePayload = (await res.json()) as GoogleTokenInfo;
  } catch {
    return NextResponse.json({ ok: false, error: "google_verify_failed" }, { status: 502 });
  }

  if (!googlePayload?.email || googlePayload.email_verified !== "true") {
    return NextResponse.json({ ok: false, error: "email_not_verified" }, { status: 401 });
  }

  // Validate audience matches our OAuth client
  const clientId = process.env["AUTH_GOOGLE_ID"]?.trim();
  if (clientId && googlePayload.aud !== clientId) {
    return NextResponse.json({ ok: false, error: "invalid_audience" }, { status: 401 });
  }

  const email = googlePayload.email.trim().toLowerCase();

  // Upsert user — same pattern as web auth.ts createUser
  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      emailVerified: new Date(),
      role: "COLLECTOR",
    },
    update: { emailVerified: new Date() },
    select: { id: true, role: true, email: true, name: true, image: true },
  });

  const roleMap: Record<string, "collector" | "artist" | "operator"> = {
    COLLECTOR: "collector",
    ARTIST: "artist",
    OPERATOR: "operator",
  };
  const role = roleMap[user.role] ?? "collector";

  const accessToken = signMobileAccessToken(user.id, role, user.email ?? email);
  const refreshToken = signMobileRefreshToken(user.id);

  return NextResponse.json(
    {
      ok: true,
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role,
      },
    },
    {
      status: 200,
      headers: { "X-Robots-Tag": "noindex" },
    },
  );
}
