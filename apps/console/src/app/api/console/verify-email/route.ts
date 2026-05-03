import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashVerificationToken, isLikelyVerificationTokenParam } from "@/lib/consoleVerificationToken";
import { consolePublicOrigin } from "@/lib/consoleOrigin";

/**
 * ISO 27001 A.9.4.2 / A.14.2.1 / A.13.1.3 (CLAUDE.md §2, §1, §6)
 * KO: 이메일 인증 토큰은 SHA-256 해시로만 저장·조회하고, 만료·일회용으로 위조를 완화한다.
 * JA: メール検証トークンはSHA-256ハッシュのみで保存・照合し、期限と一回限りで改ざんリスクを下げる。
 * EN: Verification tokens are stored and looked up as SHA-256 hashes with expiry and single use to reduce abuse.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const raw = url.searchParams.get("token") ?? "";
  // Use CONSOLE_PUBLIC_ORIGIN for redirects — url.origin may resolve to 0.0.0.0 behind reverse proxy.
  const origin = consolePublicOrigin();

  if (!isLikelyVerificationTokenParam(raw)) {
    return NextResponse.redirect(`${origin}/login?verify=invalid`);
  }

  const tokenHash = hashVerificationToken(raw);

  const row = await prisma.verificationToken.findUnique({
    where: { token: tokenHash },
    select: { identifier: true, expires: true },
  });

  if (!row || row.expires < new Date()) {
    return NextResponse.redirect(`${origin}/login?verify=expired`);
  }

  const email = row.identifier;
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" }, emailVerified: null },
    select: { id: true },
  });
  if (!user) {
    await prisma.verificationToken.delete({ where: { token: tokenHash } }).catch(() => undefined);
    return NextResponse.redirect(`${origin}/login?verify=invalid`);
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.delete({ where: { token: tokenHash } }),
  ]);

  return NextResponse.redirect(`${origin}/login?verify=ok`);
}
