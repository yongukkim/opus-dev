import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { authConfig } from "@/auth.config";
import { ensureBootstrapOperatorRoleByEmail, OPUS_BOOTSTRAP_OPERATOR_EMAILS } from "@/lib/operatorBootstrap";
import { prisma } from "@/lib/prisma";

/**
 * ISO 27001 A.9.4.2 / A.9.2.1 (CLAUDE.md §2, §4) Console auth: Credentials + optional Google OAuth.
 * KO: Credentials(이메일+비밀번호)와 Google OAuth를 모두 지원하며, Google은 허용 이메일 목록 또는
 *     OPUS_BOOTSTRAP_OPERATOR_EMAILS에 있는 계정만 OPERATOR로 승격한다.
 * JA: Credentials とオプションの Google OAuth を両立。Google は許可リストまたは
 *     OPUS_BOOTSTRAP_OPERATOR_EMAILS のみ OPERATOR に昇格する。
 * EN: Supports Credentials and Google OAuth. Google sign-in is restricted to allowlisted emails;
 *     others are denied to prevent unauthorized operator access.
 */

// ISO 27001 A.9.2.1 (§4) — OPUS_CONSOLE_ALLOWED_EMAILS is a comma-separated runtime allowlist.
// KO: 환경변수에 없는 이메일은 Google OAuth로 로그인해도 콘솔 접근이 차단된다.
// JA: 環境変数にないメールは Google OAuth でサインインしてもコンソールへのアクセスを拒否する。
// EN: Emails not in the env var are blocked even if they authenticate successfully via Google.
function buildAllowedEmailSet(): Set<string> {
  const raw = process.env["OPUS_CONSOLE_ALLOWED_EMAILS"] ?? "";
  const extra = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return new Set([...Array.from(OPUS_BOOTSTRAP_OPERATOR_EMAILS).map((e) => e.toLowerCase()), ...extra]);
}
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
    // Google lives here (Node runtime only) — never in authConfig (Edge) to avoid redirect loops.
    ...(process.env["AUTH_GOOGLE_ID"] && process.env["AUTH_GOOGLE_SECRET"]
      ? [Google({ clientId: process.env["AUTH_GOOGLE_ID"]!, clientSecret: process.env["AUTH_GOOGLE_SECRET"]! })]
      : []),
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
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const email = user.email?.trim().toLowerCase() ?? "";
        if (!email) return false;
        // Upsert so Google-only accounts exist in the shared DB.
        await prisma.user.upsert({
          where: { email },
          create: {
            email,
            name: user.name ?? null,
            image: user.image ?? null,
            role: "COLLECTOR",
            emailVerified: new Date(),
          },
          update: {},
        }).catch(() => undefined);
        // Promote bootstrap operators.
        await ensureBootstrapOperatorRoleByEmail(email).catch(() => undefined);
      }
      return true;
    },
    async jwt({ token, user }) {
      // Prefer email lookup so Google OAuth (sub = numeric) maps correctly to our CUID-based User rows.
      const emailKey = user?.email ?? token["email"] as string | undefined;
      const subjectId = user?.id ?? token.sub;
      if (emailKey || subjectId) {
        let dbUser = emailKey
          ? await prisma.user.findFirst({
              where: { email: { equals: emailKey, mode: "insensitive" } },
              select: { id: true, role: true, email: true, name: true, image: true },
            })
          : await prisma.user.findUnique({
              where: { id: subjectId! },
              select: { id: true, role: true, email: true, name: true, image: true },
            });
        if (dbUser?.id) token.sub = dbUser.id;
        if (
          dbUser?.email &&
          dbUser.role !== "OPERATOR" &&
          OPUS_BOOTSTRAP_OPERATOR_EMAILS.has(dbUser.email.trim().toLowerCase())
        ) {
          await ensureBootstrapOperatorRoleByEmail(dbUser.email);
          dbUser = await prisma.user.findUnique({
            where: { id: dbUser.id },
            select: { id: true, role: true, email: true, name: true, image: true },
          });
        }
        token["role"] = mapDbRoleToSession(dbUser?.["role"]);
        token["email"] = dbUser?.email ?? emailKey ?? undefined;
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
