import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import LineProvider from "@/lib/lineOAuthProvider";
import {
  storefrontAppleCredentials,
  storefrontGoogleConfigured,
  storefrontLineCredentials,
} from "@/lib/storefrontOAuthEnv";
import { storefrontSessionMaxAgeSeconds } from "@/lib/storefrontSession";

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
 * AUTH_LINE_ID/SECRET or LINE_LOGIN_CHANNEL_ID/SECRET. Callback: `{AUTH_URL}/api/auth/callback/{provider}`.
 *
 * ISO 27001 A.9.4.2 (§2) — JWT `session.maxAge` caps wall-clock session length (see `OPUS_WEB_SESSION_MAX_AGE_SECONDS`).
 * KO: 세션 만료는 Edge·Node 공통 `auth.config`의 maxAge로만 제한한다(비밀은 env).
 * JA: セション期限は Edge/Node 共通の auth.config の maxAge のみで制限する（秘密は env）。
 * EN: Session expiry is enforced only via shared `auth.config` maxAge on Edge and Node (secrets in env).
 */
const googleOn = storefrontGoogleConfigured();
const apple = storefrontAppleCredentials();
const line = storefrontLineCredentials();

export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt", maxAge: storefrontSessionMaxAgeSeconds() },
  providers: [
    ...(googleOn
      ? [
          Google({
            clientId: process.env["AUTH_GOOGLE_ID"]!,
            clientSecret: process.env["AUTH_GOOGLE_SECRET"]!,
          }),
        ]
      : []),
    ...(apple
      ? [
          Apple({
            clientId: apple.id,
            clientSecret: apple.secret,
          }),
        ]
      : []),
    ...(line
      ? [
          LineProvider({
            clientId: line.id,
            clientSecret: line.secret,
          }),
        ]
      : []),
  ],
} satisfies NextAuthConfig;
