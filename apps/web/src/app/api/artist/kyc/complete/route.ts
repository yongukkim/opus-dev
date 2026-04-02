import { NextResponse } from "next/server";
import { OPUS_ARTIST_KYC_COOKIE } from "@/lib/artistKyc";
import { OPUS_VAULT_UI_ROLE_COOKIE } from "@/lib/vaultRole";

/**
 * ISO 27001 / OPUS Security Coding Standards
 * - A.18.1.4 (§7) Privacy by Design (APPI readiness)
 *   KO: 작가 KYC 상태는 PII 원문을 저장하지 않고, 최소 정보(verified/pending)만 쿠키로 보관합니다(본 운영은 KYC 제공자 토큰/세션으로 대체).
 *   JA: 作家KYCの状態はPII原文を保存せず、最小情報（verified/pending）のみをクッキーに保持します（本番はKYC提供者トークン/セッションに置換）。
 *   EN: Artist KYC stores no raw PII; only minimal state (verified/pending) is kept in a cookie (production will use provider tokens/session).
 *
 * - A.9.4.2 (§2) Strong authentication & session management
 *   KO: 상태 쿠키는 HttpOnly/Secure/SameSite로 제한해 클라이언트 스크립트 접근을 차단합니다.
 *   JA: 状態クッキーはHttpOnly/Secure/SameSiteで制限し、クライアントスクリプトのアクセスを遮断します。
 *   EN: State cookie is constrained with HttpOnly/Secure/SameSite to block client-script access.
 */
export async function POST(): Promise<Response> {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(OPUS_ARTIST_KYC_COOKIE, "verified", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days (demo)
  });
  res.cookies.set(OPUS_VAULT_UI_ROLE_COOKIE, "artist", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days (demo)
  });
  return res;
}

