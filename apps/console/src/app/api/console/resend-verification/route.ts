import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendConsoleVerificationEmail } from "@/lib/consoleMail";
import { consolePublicOrigin } from "@/lib/consoleOrigin";
import { hashVerificationToken, newPlainVerificationToken } from "@/lib/consoleVerificationToken";

const VERIFY_TTL_MS = 48 * 60 * 60 * 1000;

/**
 * ISO 27001 A.9.4.2 / A.13.1.3 (CLAUDE.md §2, §6)
 * KO: 미인증 계정에 한해 인증 메일 재발송을 허용하되, 본문에 민감 정보를 넣지 않는다.
 * JA: 未検証アカウントに限り再送を許可し、本文に機微情報を入れない。
 * EN: Resend is allowed only for unverified accounts; responses stay generic (no account enumeration).
 */
export async function POST(req: Request) {
  let body: { email?: string };
  try {
    body = (await req.json()) as { email?: string };
  } catch {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true, emailVerified: true, passwordHash: true },
  });

  if (!user?.passwordHash || user.emailVerified) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const plainToken = newPlainVerificationToken();
  const tokenHash = hashVerificationToken(plainToken);
  const expires = new Date(Date.now() + VERIFY_TTL_MS);

  await prisma.verificationToken.deleteMany({ where: { identifier: email } });
  await prisma.verificationToken.create({
    data: { identifier: email, token: tokenHash, expires },
  });

  const verifyUrl = `${consolePublicOrigin()}/api/console/verify-email?token=${encodeURIComponent(plainToken)}`;

  try {
    await sendConsoleVerificationEmail(email, verifyUrl);
  } catch {
    await prisma.verificationToken.deleteMany({ where: { identifier: email } });
    return NextResponse.json({ ok: false, error: "mail_failed" }, { status: 503 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
