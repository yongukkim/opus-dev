import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

/**
 * ISO 27001 A.9.4.2 / A.13.1.3 (CLAUDE.md §2, §6) Edge-safe Auth.js config — aligned with apps/web.
 * KO: 미들웨어(Edge)와 라우트 핸들러(Node)가 공유하는 기본 설정. node:* 의존성을 두지 않는다.
 * JA: ミドルウェア(Edge)とルートハンドラ(Node)で共有する基本設定。node:* 依存を入れない。
 * EN: Shared base config for middleware (Edge) and route handlers (Node). Must NOT import any node:* modules.
 */
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
