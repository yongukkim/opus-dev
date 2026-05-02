import type { NextAuthConfig } from "next-auth";

/**
 * ISO 27001 A.9.4.2 / A.13.1.3 (CLAUDE.md §2, §6) Edge-safe Auth.js base — no Node-only imports.
 * KO: 미들웨어(Edge)는 JWT 검증만 하며 Credentials `authorize`는 Node 라우트(`auth.ts`)에만 둔다.
 * JA: ミドルウェア(Edge)はJWT検証のみとし、Credentialsの authorize は Node の `auth.ts` に置く。
 * EN: Edge middleware only verifies JWT; Credentials `authorize` lives in Node `auth.ts`.
 */
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  providers: [],
} satisfies NextAuthConfig;
