import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { authConfig } from "@/auth.config";
import { ensureBootstrapOperatorRoleByEmail, OPUS_BOOTSTRAP_OPERATOR_EMAILS } from "@/lib/operatorBootstrap";
import { prisma } from "@/lib/prisma";

/**
 * ISO 27001 / OPUS Security — operator console uses email + password (bcrypt) with verified email; roles from shared DB.
 * KO: Google OAuth를 쓰지 않고 Credentials로만 인증하며, 역할은 동일 Postgres `User` 행에서만 읽는다.
 * JA: Google OAuthを使わずCredentialsのみで認証し、ロールは同一PostgresのUser行のみから読む。
 * EN: Console authenticates with email/password (no Google SSO); roles are read only from shared `User` rows.
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
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === "string" ? credentials.email.trim() : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password) return null;

        const user = await prisma.user.findFirst({
          where: { email: { equals: email, mode: "insensitive" } },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            passwordHash: true,
            emailVerified: true,
          },
        });
        if (!user?.passwordHash || !user.email) return null;
        if (!user.emailVerified) return null;

        const ok = await compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    async signIn() {
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
});
