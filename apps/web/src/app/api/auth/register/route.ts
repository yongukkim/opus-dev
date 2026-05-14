import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { defaultLocale, locales } from "@/i18n/config";
import { OPUS_PRIVACY_VERSION, OPUS_TERMS_VERSION } from "@/lib/legalVersions";
import { prisma } from "@/lib/prisma";
import type { OAuthConsentFlow } from "@/lib/oauthConsentCookie";
import { sendStorefrontVerificationEmail, StorefrontMailNotConfiguredError } from "@/lib/storefrontMail";
import { storefrontPublicOrigin } from "@/lib/storefrontOrigin";
import {
  hashVerificationToken,
  newPlainVerificationToken,
} from "@/lib/storefrontVerificationToken";

const VERIFY_TTL_MS = 48 * 60 * 60 * 1000;

/**
 * ISO 27001 A.14.2.1 (§1) / A.18.1.4 (§7) / A.10.1.1 (§3)
 * KO: 이메일·비밀번호 가입은 서버에서 필수 동의·버전·국외이전·연령 자기진술을 검증하고 bcrypt 해시만 저장한다.
 * JA: メール/パスワード登録はサーバで必須同意・版・国外移転・年齢の自己申告を検証し、bcryptハッシュのみ保存する。
 * EN: Email/password sign-up validates mandatory consents/versions/cross-border/age on the server and stores only a bcrypt hash.
 *
 * ISO 27001 A.9.4.2 (§2) — `emailVerified` is set only after the user opens the signed link (password reset readiness).
 * KO: 수신 가능한 사서함을 확인하기 위해 인증 링크를 보내고, 링크 확인 전에는 Credentials 로그인을 허용하지 않는다.
 * JA: 受信可能なメールボックスを確認するため検証リンクを送り、リンク確認前はCredentialsログインを許可しない。
 * EN: Send a verification link to confirm a reachable mailbox; block credentials sign-in until the link is used.
 *
 * ISO 27001 A.12.4.1 (§5)
 * KO: 구체적인 실패 사유는 계정 열거를 줄이기 위해 클라이언트에 최소한만 노출한다.
 * JA: アカウント列挙を抑えるため、失敗理由はクライアントへ最小限のみ返す。
 * EN: Return minimal failure detail to clients to reduce account-enumeration signal.
 */
function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

/** At least 10 chars; must include uppercase, lowercase, digit, and one non-alphanumeric symbol. */
function validatePasswordStrength(pw: string): boolean {
  if (pw.length < 10) return false;
  if (!/[A-Z]/.test(pw)) return false;
  if (!/[a-z]/.test(pw)) return false;
  if (!/[0-9]/.test(pw)) return false;
  if (!/[^A-Za-z0-9]/.test(pw)) return false;
  return true;
}

export async function POST(req: Request): Promise<Response> {
  try {
    const body = (await req.json()) as {
      flow?: string;
      locale?: string;
      email?: string;
      password?: string;
      passwordConfirm?: string;
      displayName?: string;
      termsAccepted?: boolean;
      privacyAccepted?: boolean;
      overseasAccepted?: boolean;
      adultAccepted?: boolean;
      marketingAccepted?: boolean;
    };

    const flow: OAuthConsentFlow | null =
      body.flow === "signup" || body.flow === "artist-signup" ? body.flow : null;
    if (!flow) {
      return NextResponse.json({ ok: false, error: "invalid_flow" }, { status: 400 });
    }

    if (
      body.locale &&
      !(locales as readonly string[]).includes(body.locale)
    ) {
      return NextResponse.json({ ok: false, error: "invalid_locale" }, { status: 400 });
    }

    const locale =
      body.locale && (locales as readonly string[]).includes(body.locale) ? body.locale : defaultLocale;

    if (
      !body.termsAccepted ||
      !body.privacyAccepted ||
      !body.overseasAccepted ||
      !body.adultAccepted
    ) {
      return NextResponse.json({ ok: false, error: "consent_required" }, { status: 400 });
    }

    const email = normalizeEmail(typeof body.email === "string" ? body.email : "");
    const password = typeof body.password === "string" ? body.password : "";
    const passwordConfirm = typeof body.passwordConfirm === "string" ? body.passwordConfirm : "";
    const displayName =
      typeof body.displayName === "string" ? body.displayName.trim().slice(0, 120) : "";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "email_invalid" }, { status: 400 });
    }
    if (password !== passwordConfirm) {
      return NextResponse.json({ ok: false, error: "password_mismatch" }, { status: 400 });
    }
    if (!validatePasswordStrength(password)) {
      return NextResponse.json({ ok: false, error: "password_weak" }, { status: 400 });
    }

    const existing = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true, passwordHash: true },
    });
    if (existing?.passwordHash) {
      return NextResponse.json({ ok: false, error: "email_taken" }, { status: 409 });
    }
    if (existing && !existing.passwordHash) {
      return NextResponse.json({ ok: false, error: "oauth_email_exists" }, { status: 409 });
    }

    const passwordHash = await hash(password, 12);
    const now = new Date();
    const marketing = body.marketingAccepted === true;
    const role = flow === "artist-signup" ? "ARTIST" : "COLLECTOR";

    const plain = newPlainVerificationToken();
    const tokenHash = hashVerificationToken(plain);
    const expires = new Date(Date.now() + VERIFY_TTL_MS);

    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          name: displayName.length > 0 ? displayName : null,
          emailVerified: null,
          passwordHash,
          role,
          tosAcceptedAt: now,
          tosVersionAccepted: OPUS_TERMS_VERSION,
          privacyAcceptedAt: now,
          privacyVersionAccepted: OPUS_PRIVACY_VERSION,
          overseasTransferAcceptedAt: now,
          buyerAgeSelfAttestedAt: now,
          marketingOptInAt: marketing ? now : null,
        },
        select: { id: true },
      });
      await tx.verificationToken.deleteMany({ where: { identifier: email } });
      await tx.verificationToken.create({
        data: { identifier: email, token: tokenHash, expires },
      });
      return user.id;
    });
    const verifyUrl = `${storefrontPublicOrigin()}/api/auth/verify-email?token=${encodeURIComponent(plain)}&locale=${encodeURIComponent(locale)}`;

    try {
      await sendStorefrontVerificationEmail(email, verifyUrl);
    } catch (e) {
      console.error("[register] verification email send failed", e);
      await prisma
        .$transaction([
          prisma.verificationToken.deleteMany({ where: { identifier: email } }),
          prisma.user.delete({ where: { id: created } }),
        ])
        .catch(() => undefined);
      const code = e instanceof StorefrontMailNotConfiguredError ? "mail_not_configured" : "verification_send_failed";
      return NextResponse.json({ ok: false, error: code }, { status: 503 });
    }

    const smtpUrl = process.env["OPUS_WEB_SMTP_URL"]?.trim();
    const mailFrom = process.env["OPUS_WEB_MAIL_FROM"]?.trim();
    const devLogged = process.env.NODE_ENV !== "production" && (!smtpUrl || !mailFrom);

    return NextResponse.json({
      ok: true,
      emailVerification: devLogged ? "dev_logged" : "sent",
    });
  } catch (error) {
    console.error("[register]", error);
    const code =
      typeof error === "object" && error && "code" in error ? (error as { code?: string }).code : undefined;
    if (code === "P2002") {
      return NextResponse.json({ ok: false, error: "email_taken" }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 503 });
  }
}
