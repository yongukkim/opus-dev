/**
 * ISO 27001 A.14.2.1 (§1) — best-effort signal only (not a cryptographic device proof).
 * KO: 모바일 여부는 UX·라우팅 보조에만 쓰며, 고해상 자산 권한의 유일한 근거로 삼지 않습니다.
 * JA: モバイル判定はUX/ルーティング補助のみとし、高解像資産の唯一の根拠にしません。
 * EN: Mobile classification is a UX/routing hint only — never the sole basis for high-fidelity asset authorization.
 */
export function isLikelyMobileWebClient(
  userAgent: string | null | undefined,
  secChUaMobile: string | null | undefined,
): boolean {
  const ch = secChUaMobile?.trim();
  if (ch === "?1" || ch === "1" || ch?.toLowerCase() === "true") return true;

  const ua = (userAgent ?? "").toLowerCase();
  if (!ua) return false;

  // Desktop browsers often include "Mobile" in compatibility tokens; exclude common desktop OS without mobile hints.
  if (ua.includes("windows nt") && !ua.includes("touch")) return false;
  if (ua.includes("macintosh") && !ua.includes("iphone") && !ua.includes("ipad")) {
    // iPadOS 13+ may report Macintosh + Safari; rely on Sec-CH-UA-Mobile when absent.
    if (!ua.includes("mobile")) return false;
  }

  return /iphone|ipod|ipad|android|webos|blackberry|opera mini|opera mobi|iemobile|mobile|tablet|silk|kindle|fxios|crios/.test(
    ua,
  );
}
