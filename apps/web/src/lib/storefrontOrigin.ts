/**
 * ISO 27001 A.13.1.3 (§6) — absolute URLs in outbound mail must match deployed WEB origin.
 * KO: 인증 메일 링크는 배포된 웹 공개 오리진과 일치해야 하며, 프록시 뒤에서는 AUTH_URL 등을 우선한다.
 * JA: 認証メールのリンクは公開WEBオリジンと一致させ、プロキシ配下では AUTH_URL 等を優先する。
 * EN: Verification links must match the public web origin; prefer AUTH_URL behind reverse proxies.
 */
export function storefrontPublicOrigin(): string {
  return (
    process.env["OPUS_WEB_PUBLIC_ORIGIN"]?.trim() ||
    process.env["AUTH_URL"]?.trim() ||
    process.env["NEXTAUTH_URL"]?.trim() ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}
