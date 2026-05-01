import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { cookies } from "next/headers";
import { authConfig } from "@/auth.config";
import { readOAuthConsentFromCookieJar } from "@/lib/oauthConsentCookie";
import {
  ensureBootstrapOperatorRoleByEmail,
  OPUS_BOOTSTRAP_OPERATOR_EMAILS,
} from "@/lib/operatorBootstrap";
import { prisma } from "@/lib/prisma";
import { storefrontDefaultLocale, storefrontOrigin } from "@/lib/site";

/**
 * ISO 27001 / OPUS Security — Console Auth.js matches storefront Google OAuth + consent rules (shared DB).
 * KO: 콘솔은 웹과 동일한 Google OAuth·동의 쿠키 규칙을 쓰고, 역할은 동일 Postgres User 행에서만 읽는다.
 * JA: コンソールはウェブと同一のGoogle OAuth・同意クッキー規則を用い、ロールは同一PostgresのUser行のみから読む。
 * EN: Console uses the same Google OAuth and consent-cookie rules as the web app; roles come only from shared `User` rows.
 */
function mapDbRoleToSession(
  role: string | undefined,
): "collector" | "artist" | "operator" {
  if (role === "ARTIST" || role === "artist") return "artist";
  if (role === "OPERATOR" || role === "operator") return "operator";
  return "collector";
}

function storefrontSignupConsentErrorUrl(): string {
  return `${storefrontOrigin()}/${storefrontDefaultLocale}/signup?error=oauth_consent_required`;
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
        await ensureBootstrapOperatorRoleByEmail(email);
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
        return storefrontSignupConsentErrorUrl();
      }
      return true;
    },
    async jwt({ token, user }) {
      const subjectId = user?.id ?? token.sub;
      if (subjectId) {
        token.sub = subjectId;
        let dbUser = await prisma.user.findUnique({
          where: { id: subjectId },
          select: { role: true, email: true, name: true, image: true },
        });
        if (
          dbUser?.email &&
          dbUser.role !== "OPERATOR" &&
          OPUS_BOOTSTRAP_OPERATOR_EMAILS.has(dbUser.email.trim().toLowerCase())
        ) {
          await ensureBootstrapOperatorRoleByEmail(dbUser.email);
          dbUser = await prisma.user.findUnique({
            where: { id: subjectId },
            select: { role: true, email: true, name: true, image: true },
          });
        }
        token["role"] = mapDbRoleToSession(dbUser?.["role"]);
        token["email"] = dbUser?.email ?? user?.email ?? token["email"] ?? undefined;
        token["name"] = dbUser?.name ?? user?.name ?? token["name"] ?? undefined;
        token["picture"] = dbUser?.image ?? user?.image ?? token["picture"] ?? undefined;
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
      if (!user.id) return;

      const email = user.email?.trim();
      if (email) await ensureBootstrapOperatorRoleByEmail(email);
      if (!consent) return;

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
