/**
 * ISO 27001 / OPUS Security Coding Standards
 * - A.14.2.1 (§1) Input validation & sanitization
 *   KO: returnTo는 내부 경로만 허용하여 오픈 리다이렉트(외부 URL 이동)를 차단합니다.
 *   JA: returnToは内部パスのみ許可し、オープンリダイレクト（外部URLへの遷移）を防止します。
 *   EN: returnTo allows only internal paths to prevent open redirects to external URLs.
 */
export function sanitizeReturnTo(raw: string | undefined, fallback: string): string {
  const value = (raw ?? "").trim();
  if (!value) return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  if (value.includes("://")) return fallback;
  if (value.includes("\\") || value.includes("\n") || value.includes("\r")) return fallback;
  return value;
}

