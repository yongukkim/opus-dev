import crypto from "node:crypto";

export type MobileAssetLeaseTokenV1 = {
  v: 1;
  userId: string;
  deviceId: string;
  artworkSlug: string;
  /** ISO string */
  expiresAt: string;
};

function hmacSecret(): string {
  // Dev fallback only. Production must set OPUS_MOBILE_ASSET_HMAC_SECRET.
  return process.env["OPUS_MOBILE_ASSET_HMAC_SECRET"] || "opus-dev-mobile-asset-secret";
}

function b64url(buf: Buffer): string {
  return buf.toString("base64url");
}

function unb64url(s: string): Buffer {
  return Buffer.from(s, "base64url");
}

export function signMobileAssetLeaseTokenV1(payload: MobileAssetLeaseTokenV1): string {
  const data = Buffer.from(JSON.stringify(payload), "utf8");
  const sig = crypto.createHmac("sha256", hmacSecret()).update(data).digest();
  return `${b64url(data)}.${b64url(sig)}`;
}

export function verifyMobileAssetLeaseTokenV1(token: string): MobileAssetLeaseTokenV1 | null {
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
    const parsed = JSON.parse(data.toString("utf8")) as MobileAssetLeaseTokenV1;
    if (parsed?.v !== 1) return null;
    if (!parsed.userId || !parsed.artworkSlug || !parsed.expiresAt) return null;
    const exp = new Date(parsed.expiresAt);
    if (Number.isNaN(exp.getTime())) return null;
    if (Date.now() >= exp.getTime()) return null;
    return parsed;
  } catch {
    return null;
  }
}

