import { headers } from "next/headers";

/**
 * ISO 27001 A.14.2.1 (§1)
 * KO: QR 등에 쓸 절대 URL은 신뢰할 수 있는 프록시 헤더와 호스트만 조합합니다(임의 스킴·호스트 주입 방지).
 * JA: QR用の絶対URLは信頼できるプロキシヘッダとホストのみを組み合わせます。
 * EN: Build absolute URLs for QR from trusted proxy headers and host only.
 */
export async function resolveSiteBaseUrl(): Promise<string> {
  const env = process.env["NEXT_PUBLIC_SITE_URL"]?.trim().replace(/\/$/, "");
  if (env) return env;

  const h = await headers();
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(",")[0]?.trim();
  if (!host) return "http://localhost:3000";

  const rawProto = (h.get("x-forwarded-proto") ?? "https").split(",")[0]?.trim().toLowerCase() ?? "https";
  const proto = rawProto === "http" || rawProto === "https" ? rawProto : "https";
  return `${proto}://${host}`;
}
