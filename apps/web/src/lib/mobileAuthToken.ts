import crypto from "node:crypto";

/**
 * ISO 27001 A.9.4.2 / A.13.1.3 (CLAUDE.md §2, §6)
 * KO: 모바일 앱 전용 Bearer 토큰(access + refresh). HttpOnly 쿠키 세션 없이 네이티브 앱에서 인증.
 * JA: モバイルアプリ専用 Bearer トークン（access + refresh）。HttpOnly クッキーなしでネイティブ認証。
 * EN: Mobile-app-only Bearer tokens (access + refresh) for native clients without HttpOnly cookies.
 */

export type MobileAccessTokenPayload = {
  v: 1;
  type: "access";
  sub: string; // userId
  role: "collector" | "artist" | "operator";
  email: string;
  /** ISO string */
  exp: string;
};

export type MobileRefreshTokenPayload = {
  v: 1;
  type: "refresh";
  sub: string;
  jti: string; // single-use guard
  /** ISO string */
  exp: string;
};

function hmacSecret(): string {
  return process.env["OPUS_MOBILE_AUTH_HMAC_SECRET"] || process.env["AUTH_SECRET"] || "opus-dev-mobile-auth-secret";
}

function b64url(buf: Buffer): string {
  return buf.toString("base64url");
}

function unb64url(s: string): Buffer {
  return Buffer.from(s, "base64url");
}

function sign(payload: object): string {
  const data = Buffer.from(JSON.stringify(payload), "utf8");
  const sig = crypto.createHmac("sha256", hmacSecret()).update(data).digest();
  return `${b64url(data)}.${b64url(sig)}`;
}

function verify<T>(token: string): T | null {
  const [dataB64 = "", sigB64 = ""] = token.split(".");
  if (!dataB64 || !sigB64) return null;
  let data: Buffer, sig: Buffer;
  try {
    data = unb64url(dataB64);
    sig = unb64url(sigB64);
  } catch {
    return null;
  }
  const expected = crypto.createHmac("sha256", hmacSecret()).update(data).digest();
  if (sig.length !== expected.length || !crypto.timingSafeEqual(sig, expected)) return null;
  try {
    return JSON.parse(data.toString("utf8")) as T;
  } catch {
    return null;
  }
}

const ACCESS_TTL_MS = 15 * 60 * 1000; // 15 minutes
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function signMobileAccessToken(sub: string, role: MobileAccessTokenPayload["role"], email: string): string {
  const payload: MobileAccessTokenPayload = {
    v: 1,
    type: "access",
    sub,
    role,
    email,
    exp: new Date(Date.now() + ACCESS_TTL_MS).toISOString(),
  };
  return sign(payload);
}

export function signMobileRefreshToken(sub: string): string {
  const payload: MobileRefreshTokenPayload = {
    v: 1,
    type: "refresh",
    sub,
    jti: crypto.randomBytes(16).toString("hex"),
    exp: new Date(Date.now() + REFRESH_TTL_MS).toISOString(),
  };
  return sign(payload);
}

export function verifyMobileAccessToken(token: string): MobileAccessTokenPayload | null {
  const payload = verify<MobileAccessTokenPayload>(token);
  if (!payload || payload.v !== 1 || payload.type !== "access") return null;
  if (Date.now() >= new Date(payload.exp).getTime()) return null;
  return payload;
}

export function verifyMobileRefreshToken(token: string): MobileRefreshTokenPayload | null {
  const payload = verify<MobileRefreshTokenPayload>(token);
  if (!payload || payload.v !== 1 || payload.type !== "refresh") return null;
  if (Date.now() >= new Date(payload.exp).getTime()) return null;
  return payload;
}
