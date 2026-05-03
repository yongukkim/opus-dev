import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

/**
 * ISO 27001 A.9.4.2 / A.13.1.3 (CLAUDE.md §2, §6) Edge-safe Auth.js base — no Node-only imports.
 * KO: 미들웨어(Edge)는 JWT 검증만 하며 Credentials `authorize`는 Node 라우트(`auth.ts`)에만 둔다.
 * JA: ミドルウェア(Edge)はJWT検証のみとし、Credentialsの authorize は Node の `auth.ts` に置く。
 * EN: Edge middleware only verifies JWT; Credentials `authorize` lives in Node `auth.ts`.
 */

// ISO 27001 A.9.4.2 (§2) — Google OAuth is only activated when both env vars are present at runtime.
// KO: 런타임에 두 환경변수가 모두 있어야 Google provider가 활성화된다.
// JA: 両環境変数が揃っているときのみ Google プロバイダが有効になる。
// EN: Google provider is enabled only when both AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET are present.
const useGoogle =
  Boolean(process.env["AUTH_GOOGLE_ID"]?.trim()) &&
  Boolean(process.env["AUTH_GOOGLE_SECRET"]?.trim());

export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  providers: useGoogle
    ? [
        Google({
          clientId: process.env["AUTH_GOOGLE_ID"]!,
          clientSecret: process.env["AUTH_GOOGLE_SECRET"]!,
        }),
      ]
    : [],
} satisfies NextAuthConfig;
