/**
 * LINE Login (OAuth 2.0 + OpenID Connect userinfo).
 * ISO 27001 A.9.4.2 / A.13.1.3 (§2, §6) — Edge-safe provider config (URLs + client id/secret only; no DB).
 * KO: LINE OIDC userinfo로 최소 프로필을 받으며, 토큰·비밀은 Auth.js/DB 경로에서만 처리한다.
 * JA: LINE OIDC の userinfo で最小プロフィールを受け取り、トークン/秘密は Auth.js/DB のみで扱う。
 * EN: Fetches minimal profile via LINE OIDC userinfo; tokens/secrets stay in Auth.js/DB paths only.
 *
 * Callback URL (Auth.js): `{AUTH_URL}/api/auth/callback/line`
 * Required LINE channel scopes: openid, profile, email (email requires channel permission).
 */
export interface LineOidcProfile {
  sub: string;
  name?: string;
  picture?: string;
  email?: string;
}

export default function LineProvider(options: { clientId: string; clientSecret: string }) {
  return {
    id: "line",
    name: "LINE",
    type: "oauth" as const,
    checks: ["state" as const],
    authorization: {
      url: "https://access.line.me/oauth2/v2.1/authorize",
      params: {
        scope: "openid profile email",
        response_type: "code",
      },
    },
    token: "https://api.line.me/oauth2/v2.1/token",
    userinfo: "https://api.line.me/oauth2/v2.1/userinfo",
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    profile(profile: LineOidcProfile) {
      return {
        id: profile.sub,
        name: profile.name,
        email: profile.email ?? undefined,
        image: profile.picture,
      };
    },
    style: { bg: "#06C755", text: "#fff" },
  };
}
