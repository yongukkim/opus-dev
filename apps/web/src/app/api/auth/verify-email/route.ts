import { NextResponse } from "next/server";
import { normalizeLocale, withLocale } from "@/i18n/paths";
import { prisma } from "@/lib/prisma";
import { storefrontPublicOrigin } from "@/lib/storefrontOrigin";
import { hashVerificationToken, isLikelyVerificationTokenParam } from "@/lib/storefrontVerificationToken";

/**
 * ISO 27001 A.9.4.2 / A.14.2.1 / A.13.1.3 (CLAUDE.md §2, §1, §6)
 * KO: 이메일 인증 토큰은 SHA-256 해시로만 저장·조회하고 만료·일회용으로 남용을 완화한다.
 * JA: メール検証トークンはSHA-256ハッシュのみで保存・照合し、期限と一回限りで濫用リスクを下げる。
 * EN: Verification tokens are stored and matched as SHA-256 hashes with expiry and single use to reduce abuse.
 */
export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const raw = url.searchParams.get("token") ?? "";
  const localeRaw = url.searchParams.get("locale") ?? "";
  const locale = normalizeLocale(localeRaw);

  const origin = storefrontPublicOrigin();
  const loginPath = withLocale(locale, "/login");

  if (!isLikelyVerificationTokenParam(raw)) {
    return NextResponse.redirect(`${origin}${loginPath}?verify=invalid`);
  }

  const tokenHash = hashVerificationToken(raw);

  const row = await prisma.verificationToken.findUnique({
    where: { token: tokenHash },
    select: { identifier: true, expires: true },
  });

  if (!row || row.expires < new Date()) {
    return NextResponse.redirect(`${origin}${loginPath}?verify=expired`);
  }

  const email = row.identifier;
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" }, emailVerified: null },
    select: { id: true },
  });
  if (!user) {
    await prisma.verificationToken.delete({ where: { token: tokenHash } }).catch(() => undefined);
    return NextResponse.redirect(`${origin}${loginPath}?verify=invalid`);
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.delete({ where: { token: tokenHash } }),
  ]);

  return NextResponse.redirect(`${origin}${loginPath}?verify=ok`);
}
