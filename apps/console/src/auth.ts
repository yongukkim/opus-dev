import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { authConfig, googleAuthProviders } from "@/auth.config";
import { verifyConsoleOtpAndLoadOperatorUser } from "@/lib/consoleOtp";
import {
  ensureBootstrapOperatorRoleByEmail,
  OPUS_BOOTSTRAP_OPERATOR_EMAILS,
} from "@/lib/operatorBootstrap";
import { prisma } from "@/lib/prisma";
import { defaultLocale, storefrontOrigin } from "@/lib/site";

/**
 * ISO 27001 / OPUS Security — Console uses the same User table as the storefront (shared DATABASE_URL).
 * KO: 콘솔 전용 인스턴스이나 식별·역할의 진실 원장은 동일 Postgres User 행이다.
 * JA: コンソール専用インスタンスだが、識別・ロールの正は同一PostgresのUser行である。
 * EN: Dedicated console app; identity and roles remain the same Postgres `User` rows as the storefront.
 */
function mapDbRoleToSession(
  role: string | undefined,
): "collector" | "artist" | "operator" {
  if (role === "ARTIST" || role === "artist") return "artist";
  if (role === "OPERATOR" || role === "operator") return "operator";
  return "collector";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    ...googleAuthProviders,
    Credentials({
      id: "console-otp",
      name: "Email code",
      credentials: {
        email: { label: "Email", type: "email" },
        code: { label: "Code", type: "text" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email;
        const code = credentials?.code;
        if (typeof email !== "string" || typeof code !== "string") return null;
        const user = await verifyConsoleOtpAndLoadOperatorUser(email, code);
        if (!user) return null;
        return {
          id: user.id,
          email: user.email ?? undefined,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
        };
      },
    }),
  ],
  adapter: PrismaAdapter(prisma),
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "console-otp") {
        return true;
      }
      if (account?.provider !== "google") {
        return true;
      }

      const email = user.email?.trim();
      if (!email) return false;

      const existing = await prisma.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
        select: { id: true, role: true },
      });
      if (!existing) {
        return `${storefrontOrigin()}/${defaultLocale}/signup`;
      }

      await ensureBootstrapOperatorRoleByEmail(email);
      const fresh = await prisma.user.findUnique({
        where: { id: existing.id },
        select: { role: true },
      });
      return fresh?.role === "OPERATOR";
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
      const email = user.email?.trim();
      if (email) await ensureBootstrapOperatorRoleByEmail(email);
    },
  },
});
