import type { NextAuthConfig } from "next-auth";

/**
 * ISO 27001 A.9.4.2 / A.13.1.3 (CLAUDE.md §2, §6) Edge-safe Auth.js base — no Node-only imports.
 * KO: 미들웨어(Edge)는 JWT 검증만 하며 providers는 Node 라우트(`auth.ts`)에만 둔다.
 *     Google provider를 Edge config에 넣으면 미들웨어에서 세션을 못 읽는 redirect loop가 생긴다.
 * JA: ミドルウェア(Edge)はJWT検証のみとし、providers は Node の `auth.ts` にのみ置く。
 * EN: Edge middleware only verifies JWT; providers live in Node `auth.ts` only.
 *     Adding Google to Edge config causes redirect loops (middleware can't read the session).
 */
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  providers: [],
} satisfies NextAuthConfig;
