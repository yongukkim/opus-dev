import { NextResponse } from "next/server";
import { defaultLocale, locales } from "@/i18n/config";
import { prisma } from "@/lib/prisma";
import { sendStorefrontVerificationEmail } from "@/lib/storefrontMail";
import { storefrontPublicOrigin } from "@/lib/storefrontOrigin";
import {
  hashVerificationToken,
  newPlainVerificationToken,
} from "@/lib/storefrontVerificationToken";

const VERIFY_TTL_MS = 48 * 60 * 60 * 1000;

/**
 * ISO 27001 A.13.1.3 / A.12.4.1 (§6, §5) — resend verification without leaking whether the email exists.
 * KO: 응답 본문은 항상 동일한 성공 형태로 두고, 계정 존재 여부를 노출하지 않는다.
 * JA: レスポンス本文は常に同じ成功形にし、アカウントの有無を漏らさない。
 * EN: Always return the same success shape so the endpoint does not leak account existence.
 */
function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export async function POST(req: Request): Promise<Response> {
  try {
    const body = (await req.json()) as { email?: string; locale?: string };
    const email = normalizeEmail(typeof body.email === "string" ? body.email : "");
    const locale =
      body.locale && (locales as readonly string[]).includes(body.locale) ? body.locale : defaultLocale;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: true });
    }

    const user = await prisma.user.findFirst({
      where: {
        email: { equals: email, mode: "insensitive" },
        passwordHash: { not: null },
        emailVerified: null,
      },
      select: { id: true, email: true },
    });

    if (!user?.email) {
      return NextResponse.json({ ok: true });
    }

    const plain = newPlainVerificationToken();
    const tokenHash = hashVerificationToken(plain);
    const expires = new Date(Date.now() + VERIFY_TTL_MS);

    await prisma.$transaction([
      prisma.verificationToken.deleteMany({ where: { identifier: user.email } }),
      prisma.verificationToken.create({
        data: { identifier: user.email, token: tokenHash, expires },
      }),
    ]);

    const verifyUrl = `${storefrontPublicOrigin()}/api/auth/verify-email?token=${encodeURIComponent(plain)}&locale=${encodeURIComponent(locale)}`;
    try {
      await sendStorefrontVerificationEmail(user.email, verifyUrl);
    } catch (e) {
      console.error("[resend-verification] send failed", e);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[resend-verification]", error);
    return NextResponse.json({ ok: true });
  }
}
