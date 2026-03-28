import type { NextRequest } from "next/server";

/**
 * ISO 27001 A.12.4.1 (§5) Auditing — request origin for consent logs
 * KO: 프록시 환경에서는 X-Forwarded-For 첫 홉을 우선하되, 값은 감사 목적의 대략적 출처로만 쓴다.
 * JA: プロキシ配下ではX-Forwarded-Forの先頭を優先するが、監査上の大まかな出所としてのみ用いる。
 * EN: Prefer X-Forwarded-For first hop behind proxies; use as coarse audit signal only.
 */
export function getRequestClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return sanitizeIp(first);
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return sanitizeIp(realIp);
  const cf = request.headers.get("cf-connecting-ip")?.trim();
  if (cf) return sanitizeIp(cf);
  return "unknown";
}

function sanitizeIp(raw: string): string {
  const s = raw.slice(0, 64).replace(/[\s\r\n]/g, "");
  return s.length > 0 ? s.slice(0, 45) : "unknown";
}
