import NextAuth from "next-auth";
import { AuthError } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { cookies } from "next/headers";
import { defaultLocale } from "@/i18n/config";
import { prisma } from "@/lib/prisma";
import { readOAuthConsentFromCookieJar } from "@/lib/oauthConsentCookie";
import { authConfig } from "@/auth.config";

const OPUS_BOOTSTRAP_OPERATOR_EMAILS = new Set([
  "admin@opus-store.com",
]);

/**
 * ISO 27001 / OPUS Security Coding Standards
 * - A.9.4.2 (§2) Authentication & session — JWT sessions, HttpOnly cookies via Auth.js; no client-visible secrets.
 *   Session wall-clock max age: `storefrontSessionMaxAgeSeconds()` / `OPUS_WEB_SESSION_MAX_AGE_SECONDS` (default 8h).
 *   KO: Google·Apple·LINE OAuth 및 이메일+비밀번호(Credentials)와 JWT 세션을 사용하며, 토큰은 프레임워크 쿠키로만 다룬다.
 *   JA: Google/Apple/LINE OAuth とメール+パスワード(Credentials)とJWTセッションを用い、トークンはフレームワークのクッキーのみで扱う。
 *   EN: Google, Apple, LINE OAuth plus email/password (Credentials) with JWT sessions; tokens stay in framework cookies only.
 *   KO (Credentials): 이메일+비밀번호 로그인은 DB에 `emailVerified`가 있는 계정만 허용한다(가입 직후 메일 인증 필요).
 *   JA (Credentials): メール+パスワードログインはDBで emailVerified があるアカウントのみ許可する(登録直後はメール認証が必要)。
 *   EN (Credentials): Email/password sign-in is allowed only when `emailVerified` is set (inbox verification required after sign-up).
 * - A.9.2.1 (§4) RBAC — application role is loaded from the database at sign-in (default COLLECTOR).
 *   KO: 세션의 역할은 DB의 OpusRole에서만 결정되며 클라이언트 표시값을 신뢰하지 않는다.
 *   JA: セッションの権限はDBのOpusRoleのみから決まり、クライアント表示を信頼しない。
 *   EN: Session role comes only from `OpusRole` in the database — never trust client-supplied roles.
 * - A.18.1.4 (§7) APPI — new OAuth accounts require a signed pre-OAuth consent cookie (ToS, Privacy, overseas transfer, 18+).
 *   KO: 신규 SNS 계정은 OAuth 직전 동의 쿠키가 없으면 가입을 거절한다(이메일 가입은 /api/auth/register에서 동의를 직접 검증).
 *   JA: 新規SNSアカウントはOAuth直前の同意クッキーがなければ拒否する(メール登録は /api/auth/register で同意を検証)。
 *   EN: New OAuth accounts are rejected without the short-lived signed consent cookie; email sign-up validates consent in `/api/auth/register`.
 *
 * NOTE: This file uses Node-only modules (Prisma, node:crypto via cookie verifier) and MUST NOT be
 * imported from Edge contexts (middleware). Edge code must import `@/auth.config` instead.
 *
 * ISO 27001 A.9.4.2 (§2) / A.12.4.1 (§5)
 * KO: `auth()` 무인자 호출은 JWT 세션 쿠키 복호화 실패(JWTSessionError 등) 시 예외를 삼키지 않고 `null`을 반환해
 *     레이아웃·헤더 RSC가 중단되지 않게 한다(손상·만료·배포 시크릿 변경 쿠키는 로그아웃과 동등하게 취급).
 * JA: 引数なしの `auth()` はJWTセッションCookie復号失敗時に例外でなく `null` を返し、レイアウト/ヘッダのRSCを落とさない。
 * EN: Parameterless `auth()` returns `null` on undecryptable JWT session cookies so layout/header RSC does not crash.
 */
function mapDbRoleToSession(
  role: string | undefined,
): "collector" | "artist" | "operator" {
  if (role === "ARTIST" || role === "artist") return "artist";
  if (role === "OPERATOR" || role === "operator") return "operator";
  return "collector";
}

/**
 * ISO 27001 A.9.2.1 (§4) Least Privilege RBAC
 * KO: 지정된 운영자 이메일은 로그인 시 DB 역할을 OPERATOR로 강제 동기화해 권한 기준을 서버 DB에 일관되게 유지합니다.
 * JA: 指定された運営者メールはログイン時にDBロールをOPERATORへ同期し、権限制御の基準をサーバDBで一貫化します。
 * EN: Designated operator emails are synchronized to OPERATOR in the DB at sign-in to keep RBAC source-of-truth server-side.
 */
async function ensureBootstrapOperatorRoleByEmail(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase();
  if (!OPUS_BOOTSTRAP_OPERATOR_EMAILS.has(normalized)) return;
  await prisma.user.updateMany({
    where: { email: { equals: email.trim(), mode: "insensitive" }, NOT: { role: "OPERATOR" } },
    data: { role: "OPERATOR" },
  });
}

/** OAuth providers that share the same APPI pre-consent cookie gate as Google. */
const STOREFRONT_OAUTH_WITH_CONSENT = new Set(["google", "apple", "line"]);

const { handlers, auth: authInternal, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    ...authConfig.providers,
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
      const provider = account?.provider;

      if (provider === "credentials") {
        const email = user.email?.trim();
        if (email) await ensureBootstrapOperatorRoleByEmail(email);
        return true;
      }

      if (!provider || !STOREFRONT_OAUTH_WITH_CONSENT.has(provider)) {
        return false;
      }

      const email = user.email?.trim();
      if (!email) {
        return `/${defaultLocale}/signup?error=oauth_email_required`;
      }

      const jar = await cookies();
      const consent = readOAuthConsentFromCookieJar(jar);
      const existing = await prisma.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
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
        return `/${defaultLocale}/signup?error=oauth_consent_required`;
      }
      return true;
    },
    async jwt({ token, user }) {
      const subjectId = user?.id ?? token.sub;
      if (subjectId) {
        token.sub = subjectId;
        const dbUser = await prisma.user.findUnique({
          where: { id: subjectId },
          select: { role: true, email: true, name: true, image: true },
        });
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

/** @see module block above — stale/invalid session cookie → signed-out, not a thrown RSC error. */
export const auth = ((...args: Parameters<typeof authInternal>) => {
  const argv = args as unknown[];
  if (argv.length === 0) {
    return (async () => {
      try {
        return await authInternal();
      } catch (error) {
        if (error instanceof AuthError) {
          if (error.type === "JWTSessionError" || error.type === "SessionTokenError") {
            return null;
          }
        }
        throw error;
      }
    })();
  }
  return authInternal(...(args as Parameters<typeof authInternal>));
}) as typeof authInternal;

export { handlers, signIn, signOut };
