import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import LineProvider from "@/lib/lineOAuthProvider";

/**
 * ISO 27001 A.9.4.2 / A.13.1.3 (§2, §6) Edge-safe Auth.js config.
 * KO: 미들웨어(Edge)와 라우트 핸들러(Node)가 공유하는 기본 설정. node:* 의존성을 두지 않는다.
 * JA: ミドルウェア(Edge)とルートハンドラ(Node)で共有する基本設定。node:* 依存を入れない。
 * EN: Shared base config for middleware (Edge) and route handlers (Node). Must NOT import any node:* modules.
 *
 * Storefront OAuth (Google / Apple / LINE) lives here so middleware sees the same provider list.
 * Credentials (email + password) are appended only in `auth.ts` (Node) because bcrypt runs in `authorize`.
 *
 * Env (no values in repo): AUTH_GOOGLE_ID/SECRET, AUTH_APPLE_ID/SECRET (JWT client secret per Apple),
 * AUTH_LINE_ID/SECRET (LINE Login channel id/secret). Callback: `{AUTH_URL}/api/auth/callback/{provider}`.
 */
const googleOn =
  Boolean(process.env["AUTH_GOOGLE_ID"]?.trim()) &&
  Boolean(process.env["AUTH_GOOGLE_SECRET"]?.trim());
const appleOn =
  Boolean(process.env["AUTH_APPLE_ID"]?.trim()) &&
  Boolean(process.env["AUTH_APPLE_SECRET"]?.trim());
const lineOn =
  Boolean(process.env["AUTH_LINE_ID"]?.trim()) &&
  Boolean(process.env["AUTH_LINE_SECRET"]?.trim());

export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  providers: [
    ...(googleOn
      ? [
          Google({
            clientId: process.env["AUTH_GOOGLE_ID"]!,
            clientSecret: process.env["AUTH_GOOGLE_SECRET"]!,
          }),
        ]
      : []),
    ...(appleOn
      ? [
          Apple({
            clientId: process.env["AUTH_APPLE_ID"]!,
            clientSecret: process.env["AUTH_APPLE_SECRET"]!,
          }),
        ]
      : []),
    ...(lineOn
      ? [
          LineProvider({
            clientId: process.env["AUTH_LINE_ID"]!,
            clientSecret: process.env["AUTH_LINE_SECRET"]!,
          }),
        ]
      : []),
  ],
} satisfies NextAuthConfig;
