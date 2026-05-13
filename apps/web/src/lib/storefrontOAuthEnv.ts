/**
 * Resolve storefront OAuth client env in one place (UI gate + auth.config must match).
 * ISO 27001 A.9.4.2 (§2) — IDs/secrets are never logged; only presence is used for gating.
 * KO: Apple/LINE 클라이언트 ID·시크릿은 이 모듈에서만 해석해 UI와 Auth.js 설정이 어긋나지 않게 한다.
 * JA: Apple/LINE のクライアントID/秘密はここでだけ解決し、UIとAuth.js設定の食い違いを防ぐ。
 * EN: Resolve Apple/LINE client id/secret here only so UI and Auth.js stay aligned.
 *
 * LINE: `AUTH_LINE_*` preferred; `LINE_LOGIN_CHANNEL_*` accepted as aliases (LINE Developers naming).
 */
export function storefrontGoogleConfigured(): boolean {
  return Boolean(
    process.env["AUTH_GOOGLE_ID"]?.trim() && process.env["AUTH_GOOGLE_SECRET"]?.trim(),
  );
}

export function storefrontAppleCredentials(): { id: string; secret: string } | null {
  const id = process.env["AUTH_APPLE_ID"]?.trim();
  const secret = process.env["AUTH_APPLE_SECRET"]?.trim();
  if (!id || !secret) return null;
  return { id, secret };
}

export function storefrontLineCredentials(): { id: string; secret: string } | null {
  const id =
    process.env["AUTH_LINE_ID"]?.trim() ||
    process.env["LINE_LOGIN_CHANNEL_ID"]?.trim() ||
    "";
  const secret =
    process.env["AUTH_LINE_SECRET"]?.trim() ||
    process.env["LINE_LOGIN_CHANNEL_SECRET"]?.trim() ||
    "";
  if (!id || !secret) return null;
  return { id, secret };
}
