import crypto from "node:crypto";

/**
 * ISO 27001 A.9.4.2 (§2) / A.10.1.1 (§3) / A.13.1.3 (§6)
 * KO: 모바일 웹 감상용 짧은 TTL 세션 토큰을 HMAC으로 서명하며, 비밀은 환경변수에서만 읽습니다.
 * JA: モバイルWeb鑑賞用の短期TTLセッショントークンをHMACで署名し、秘密は環境変数のみから読み取ります。
 * EN: Short-lived HMAC-signed viewer session tokens; secrets are read from environment variables only.
 */
export type ViewerTileSessionPayload = {
  v: 1;
  typ: "opus_viewer_tile";
  sub: string;
  submissionId: string;
  exp: string;
};

function hmacSecret(): string {
  return (
    process.env["OPUS_VIEWER_TILE_SESSION_SECRET"]?.trim() ||
    process.env["AUTH_SECRET"]?.trim() ||
    process.env["NEXTAUTH_SECRET"]?.trim() ||
    "opus-dev-viewer-tile-session-secret-32chars!!"
  );
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
  let data: Buffer;
  let sig: Buffer;
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

const TTL_MS = 15 * 60 * 1000;

export function signViewerTileSessionToken(sub: string, submissionId: string): string {
  const payload: ViewerTileSessionPayload = {
    v: 1,
    typ: "opus_viewer_tile",
    sub,
    submissionId,
    exp: new Date(Date.now() + TTL_MS).toISOString(),
  };
  return sign(payload);
}

export function verifyViewerTileSessionToken(token: string): ViewerTileSessionPayload | null {
  const p = verify<ViewerTileSessionPayload>(token);
  if (!p || p.v !== 1 || p.typ !== "opus_viewer_tile" || !p.sub || !p.submissionId || !p.exp) return null;
  const exp = Date.parse(p.exp);
  if (!Number.isFinite(exp) || exp <= Date.now()) return null;
  return p;
}
