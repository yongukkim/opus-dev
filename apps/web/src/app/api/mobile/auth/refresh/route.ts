import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMobileRefreshToken, signMobileAccessToken, signMobileRefreshToken } from "@/lib/mobileAuthToken";

export const runtime = "nodejs";

/**
 * ISO 27001 A.9.4.2 (CLAUDE.md §2)
 * KO: refresh token으로 새 access token을 발급한다.
 * JA: refresh token で新しい access token を発行する。
 * EN: Issue a new access token using a valid refresh token.
 */
export async function POST(req: NextRequest): Promise<Response> {
  let body: { refreshToken?: string } | null = null;
  try {
    body = (await req.json()) as { refreshToken?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const refreshToken = body?.refreshToken?.trim();
  if (!refreshToken) {
    return NextResponse.json({ ok: false, error: "refresh_token_required" }, { status: 400 });
  }

  const payload = verifyMobileRefreshToken(refreshToken);
  if (!payload) {
    return NextResponse.json({ ok: false, error: "invalid_refresh_token" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, role: true, email: true },
  });
  if (!user) {
    return NextResponse.json({ ok: false, error: "user_not_found" }, { status: 401 });
  }

  const roleMap: Record<string, "collector" | "artist" | "operator"> = {
    COLLECTOR: "collector",
    ARTIST: "artist",
    OPERATOR: "operator",
  };
  const role = roleMap[user.role] ?? "collector";

  const newAccessToken = signMobileAccessToken(user.id, role, user.email ?? "");
  const newRefreshToken = signMobileRefreshToken(user.id);

  return NextResponse.json({
    ok: true,
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    expiresIn: 900,
  });
}
