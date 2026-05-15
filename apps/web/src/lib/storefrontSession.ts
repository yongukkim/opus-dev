/**
 * ISO 27001 A.9.4.2 (§2) — Bound storefront JWT session wall-clock lifetime (env-tunable).
 * KO: JWT 세션 최대 유지 시간(초)을 환경변수로 제한해 탈취·방치 세션의 유효 기간을 줄인다.
 * JA: JWTセッション最大保持秒を環境変数で制限し、窃取・放置セッションの有効期間を短縮する。
 * EN: Caps storefront JWT session lifetime (seconds) via env to shorten stolen/abandoned session validity.
 */
const DEFAULT_STOREFRONT_SESSION_MAX_AGE_SEC = 60 * 60 * 8; // 8 hours
const MIN_STOREFRONT_SESSION_MAX_AGE_SEC = 60 * 5; // 5 minutes
const MAX_STOREFRONT_SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 days

export function storefrontSessionMaxAgeSeconds(): number {
  const raw = process.env["OPUS_WEB_SESSION_MAX_AGE_SECONDS"]?.trim();
  if (!raw) return DEFAULT_STOREFRONT_SESSION_MAX_AGE_SEC;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return DEFAULT_STOREFRONT_SESSION_MAX_AGE_SEC;
  return Math.min(MAX_STOREFRONT_SESSION_MAX_AGE_SEC, Math.max(MIN_STOREFRONT_SESSION_MAX_AGE_SEC, n));
}
