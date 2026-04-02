import { NextResponse } from "next/server";
import { OPUS_OPERATOR_SESSION_COOKIE } from "@/lib/operatorSession";

/**
 * ISO 27001 / OPUS Security Coding Standards
 * - A.9.4.2 (§2) Strong authentication & session management
 *   KO: 운영자 데모 세션은 HttpOnly/Secure/SameSite 쿠키로만 저장합니다. 본 운영은 SSO/RBAC 세션으로 대체합니다.
 *   JA: 運営者デモセッションはHttpOnly/Secure/SameSiteクッキーのみで保持します。本番はSSO/RBACセッションに置換します。
 *   EN: Operator demo session is stored only via HttpOnly/Secure/SameSite cookie; production will move to SSO/RBAC sessions.
 */
export async function POST(): Promise<Response> {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(OPUS_OPERATOR_SESSION_COOKIE, "1", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 2, // 2 hours
  });
  return res;
}

