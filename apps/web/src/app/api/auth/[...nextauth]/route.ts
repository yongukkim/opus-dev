import { handlers } from "@/auth";

/**
 * ISO 27001 A.13.1.3 (§6) API security — Auth.js routes; no custom PII in responses.
 * KO: OAuth 콜백은 Auth.js 표준 핸들러로만 처리한다.
 * JA: OAuthコールバックはAuth.js標準ハンドラのみで処理する。
 * EN: OAuth callbacks are handled only by Auth.js built-in handlers.
 */
export const { GET, POST } = handlers;
