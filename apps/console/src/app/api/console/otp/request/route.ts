import { NextResponse } from "next/server";
import { createConsoleOtpChallenge } from "@/lib/consoleOtp";
import { ensureBootstrapOperatorRoleByEmail } from "@/lib/operatorBootstrap";
import { prisma } from "@/lib/prisma";
import { sendConsoleOtpEmail } from "@/lib/sendConsoleOtpEmail";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_SENDS_PER_HOUR = 5;

/**
 * ISO 27001 A.9.4.2 / A.13.1.3 (§2, §6) — request operator console OTP; uniform response to limit account enumeration.
 * KO: 응답 본문은 존재 여부를 드러내지 않고, 발송·레이트리밋은 서버에서만 판단한다.
 * JA: 応答本文は存在有無を漏らさず、送信・レート制限はサーバのみが判断する。
 * EN: Response body does not reveal whether the mailbox is eligible; rate limits are enforced server-side only.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const emailRaw = typeof body === "object" && body !== null && "email" in body ? String((body as { email: unknown }).email ?? "") : "";
  const email = emailRaw.trim();
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const emailNorm = email.toLowerCase();
  await ensureBootstrapOperatorRoleByEmail(email);

  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true, email: true, role: true },
  });

  if (!user || user.role !== "OPERATOR") {
    return NextResponse.json({ ok: true });
  }

  const since = new Date(Date.now() - 60 * 60 * 1000);
  const recent = await prisma.consoleLoginOtp.count({
    where: { emailNorm, createdAt: { gte: since } },
  });
  if (recent >= MAX_SENDS_PER_HOUR) {
    return NextResponse.json({ error: "too_many_requests" }, { status: 429 });
  }

  const { plainCode } = await createConsoleOtpChallenge(emailNorm);
  if (process.env["NODE_ENV"] !== "production") {
    console.info(`[console-otp] dev OTP for ${emailNorm}: ${plainCode}`);
  }
  const to = user.email ?? email;
  const sent = await sendConsoleOtpEmail(to, plainCode);
  if (!sent.ok) {
    return NextResponse.json({ error: "email_unavailable" }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
