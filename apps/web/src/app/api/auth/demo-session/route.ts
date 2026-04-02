import { NextResponse } from "next/server";
import { OPUS_DEMO_SESSION_COOKIE } from "@/lib/demoSession";

/**
 * ISO 27001 / OPUS Security Coding Standards
 * - A.9.4.2 (§2) Strong authentication & session management
 *   KO: 데모 세션은 HttpOnly/Secure/SameSite 쿠키로만 저장하고, 짧은 만료 시간으로 제한합니다(실서비스는 OAuth/세션으로 대체).
 *   JA: デモセッションはHttpOnly/Secure/SameSiteクッキーのみで保持し、短い有効期限で制限します（本番はOAuth/セッションに置換）。
 *   EN: Demo session is stored only via HttpOnly/Secure/SameSite cookie with a short TTL (production will move to OAuth/session).
 */
export async function POST(): Promise<Response> {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(OPUS_DEMO_SESSION_COOKIE, "1", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 2, // 2 hours
  });
  return res;
}

