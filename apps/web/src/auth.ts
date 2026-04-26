import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { cookies } from "next/headers";
import { defaultLocale } from "@/i18n/config";
import { prisma } from "@/lib/prisma";
import { readOAuthConsentFromCookieJar } from "@/lib/oauthConsentCookie";
import { authConfig } from "@/auth.config";

/**
 * ISO 27001 / OPUS Security Coding Standards
 * - A.9.4.2 (§2) Authentication & session — JWT sessions, HttpOnly cookies via Auth.js; no client-visible secrets.
 *   KO: Google OAuth + JWT 세션을 사용하고, 토큰은 프레임워크가 안전한 쿠키로만 다룬다.
 *   JA: Google OAuthとJWTセッションを用い、トークンはフレームワークが安全なクッキーのみで扱う。
 *   EN: Google OAuth with JWT sessions; the framework stores tokens only in secure cookies.
 * - A.9.2.1 (§4) RBAC — application role is loaded from the database at sign-in (default COLLECTOR).
 *   KO: 세션의 역할은 DB의 OpusRole에서만 결정되며 클라이언트 표시값을 신뢰하지 않는다.
 *   JA: セッションの権限はDBのOpusRoleのみから決まり、クライアント表示を信頼しない。
 *   EN: Session role comes only from `OpusRole` in the database — never trust client-supplied roles.
 * - A.18.1.4 (§7) APPI — new accounts require a signed pre-OAuth consent cookie (ToS, Privacy, overseas transfer, 18+).
 *   KO: 신규 계정은 OAuth 직전 동의 쿠키가 없으면 가입을 거절한다.
 *   JA: 新規アカウントはOAuth直前の同意クッキーがなければ拒否する。
 *   EN: New sign-ups are rejected unless the short-lived signed consent cookie is present.
 *
 * NOTE: This file uses Node-only modules (Prisma, node:crypto via cookie verifier) and MUST NOT be
 * imported from Edge contexts (middleware). Edge code must import `@/auth.config` instead.
 */
function mapDbRoleToSession(
  role: string | undefined,
): "collector" | "artist" | "operator" {
  if (role === "ARTIST") return "artist";
  if (role === "OPERATOR") return "operator";
  return "collector";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;
      const email = user.email?.trim();
      if (!email) return false;

      const jar = await cookies();
      const consent = readOAuthConsentFromCookieJar(jar);
      const existing = await prisma.user.findUnique({
        where: { email },
        select: { id: true, role: true },
      });
      if (existing) {
        if (consent?.flow === "artist-signup" && existing.role === "COLLECTOR") {
          const acceptedAt = new Date(consent.recordedAt);
          await prisma.user.update({
            where: { id: existing.id },
            data: {
              role: "ARTIST",
              tosAcceptedAt: acceptedAt,
              tosVersionAccepted: consent.tosVersion,
              privacyAcceptedAt: acceptedAt,
              privacyVersionAccepted: consent.privacyVersion,
              overseasTransferAcceptedAt: acceptedAt,
              buyerAgeSelfAttestedAt: acceptedAt,
              ...(consent.marketing ? { marketingOptInAt: acceptedAt } : {}),
            },
          });
        }
        return true;
      }

      if (!consent) {
        return `/${defaultLocale}/signup?error=oauth_consent_required`;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, email: true, name: true, image: true },
        });
        token["role"] = mapDbRoleToSession(dbUser?.["role"]);
        token["email"] = dbUser?.email ?? user.email ?? undefined;
        token["name"] = dbUser?.name ?? user.name ?? undefined;
        token["picture"] = dbUser?.image ?? user.image ?? undefined;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token["role"] as typeof session.user.role) ?? "collector";
        if (typeof token["email"] === "string") session.user.email = token["email"];
        if (typeof token["name"] === "string") session.user.name = token["name"];
        if (typeof token["picture"] === "string") session.user.image = token["picture"];
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      const jar = await cookies();
      const consent = readOAuthConsentFromCookieJar(jar);
      if (!consent || !user.id) return;

      const acceptedAt = new Date(consent.recordedAt);
      const role = consent.flow === "artist-signup" ? "ARTIST" : "COLLECTOR";
      await prisma.user.update({
        where: { id: user.id },
        data: {
          role,
          tosAcceptedAt: acceptedAt,
          tosVersionAccepted: consent.tosVersion,
          privacyAcceptedAt: acceptedAt,
          privacyVersionAccepted: consent.privacyVersion,
          overseasTransferAcceptedAt: acceptedAt,
          buyerAgeSelfAttestedAt: acceptedAt,
          marketingOptInAt: consent.marketing ? acceptedAt : null,
        },
      });
    },
  },
});
