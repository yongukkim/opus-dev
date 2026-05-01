// Keep in sync with apps/web/src/lib/oauthConsentCookie.ts (shared consent semantics for OAuth across surfaces).
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * ISO 27001 A.9.4.2 / A.10.1.1 / A.18.1.4 (CLAUDE.md §2, §3, §7)
 * KO: OAuth 직전 동의 내역은 짧은 TTL의 HMAC 서명 쿠키로만 운반하며, 평문 PII는 넣지 않는다.
 * JA: OAuth直前の同意は短いTTLのHMAC署名クッキーのみで運び、平文PIIは入れない。
 * EN: Pre-OAuth consent is carried only in a short-lived HMAC-signed cookie; no plaintext PII in the payload.
 */
export const OPUS_OAUTH_CONSENT_COOKIE = "opus_oauth_consent";

export type OAuthConsentFlow = "login" | "signup" | "artist-signup";

export type OAuthConsentPayloadV1 = {
  v: 1;
  flow: OAuthConsentFlow;
  locale: string;
  /** ISO timestamp when /api/auth/oauth-precheck accepted the consent (server clock). */
  recordedAt: string;
  tosVersion: string;
  privacyVersion: string;
  marketing: boolean;
};

function requireSecret(): string {
  const s = process.env["AUTH_SECRET"] ?? process.env["NEXTAUTH_SECRET"];
  if (!s || s.length < 16) {
    throw new Error("[oauth-consent] AUTH_SECRET is missing or too short");
  }
  return s;
}

function optionalSecret(): string | null {
  const s = process.env["AUTH_SECRET"] ?? process.env["NEXTAUTH_SECRET"];
  if (!s || s.length < 16) return null;
  return s;
}

export function signOAuthConsentPayload(payload: OAuthConsentPayloadV1): string {
  const secret = requireSecret();
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyOAuthConsentToken(token: string): OAuthConsentPayloadV1 | null {
  try {
    const secret = optionalSecret();
    if (!secret) return null;
    const [body, sig] = token.split(".");
    if (!body || !sig) return null;
    const expected = createHmac("sha256", secret).update(body).digest("base64url");
    const a = Buffer.from(sig, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as OAuthConsentPayloadV1;
    if (
      parsed.v !== 1 ||
      (parsed.flow !== "login" && parsed.flow !== "signup" && parsed.flow !== "artist-signup")
    ) {
      return null;
    }
    if (typeof parsed.locale !== "string" || parsed.locale.length > 8) return null;
    if (typeof parsed.recordedAt !== "string") return null;
    if (typeof parsed.tosVersion !== "string" || typeof parsed.privacyVersion !== "string") return null;
    if (typeof parsed.marketing !== "boolean") return null;
    const ageMs = Date.now() - Date.parse(parsed.recordedAt);
    if (!Number.isFinite(ageMs) || ageMs < 0 || ageMs > 15 * 60 * 1000) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function readOAuthConsentFromCookieJar(jar: {
  get(name: string): { value: string } | undefined;
}): OAuthConsentPayloadV1 | null {
  const raw = jar.get(OPUS_OAUTH_CONSENT_COOKIE)?.value;
  if (!raw) return null;
  return verifyOAuthConsentToken(raw);
}
