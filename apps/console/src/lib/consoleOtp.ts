import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { ensureBootstrapOperatorRoleByEmail } from "@/lib/operatorBootstrap";

const OTP_TTL_MS = 10 * 60 * 1000;

function pepper(): string {
  return process.env["AUTH_SECRET"]?.trim() ?? "";
}

export function hashConsoleOtp(emailNorm: string, code: string): string {
  return crypto.createHash("sha256").update(`${pepper()}:${emailNorm}:${code}`).digest("hex");
}

function randomSixDigit(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

/**
 * ISO 27001 A.9.4.2 / A.14.2.1 (§2, §1) — create a single-use console login challenge; prior pending rows invalidated.
 * KO: 동일 메일의 미소비 OTP는 새 발급 시 무효화한다.
 * JA: 同一メールの未消費OTPは新規発行で無効化する。
 * EN: Invalidate prior pending OTP rows for the same normalized email when issuing a new one.
 */
export async function createConsoleOtpChallenge(emailNorm: string): Promise<{ plainCode: string }> {
  const norm = emailNorm.trim().toLowerCase();
  await prisma.consoleLoginOtp.updateMany({
    where: { emailNorm: norm, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  const plainCode = randomSixDigit();
  await prisma.consoleLoginOtp.create({
    data: {
      emailNorm: norm,
      codeHash: hashConsoleOtp(norm, plainCode),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });
  return { plainCode };
}

/**
 * ISO 27001 A.9.4.2 — verify OTP, enforce attempt ceiling, return operator user for JWT if valid.
 * KO: 검증 실패 시 시도 횟수만 증가하고 코드 평문은 기록하지 않는다.
 * JA: 検証失敗は試行回数のみ増やし、コード平文は記録しない。
 * EN: On failure, only increment attempts; never log plaintext codes.
 */
export async function verifyConsoleOtpAndLoadOperatorUser(
  emailRaw: string,
  codeRaw: string,
): Promise<{ id: string; email: string | null; name: string | null; image: string | null } | null> {
  const emailNorm = emailRaw.trim().toLowerCase();
  const code = codeRaw.trim().replace(/\s/g, "");
  if (!emailNorm || !/^\d{6}$/.test(code)) return null;

  const row = await prisma.consoleLoginOtp.findFirst({
    where: {
      emailNorm,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!row || row.verifyAttempts >= 8) return null;

  const expected = hashConsoleOtp(emailNorm, code);
  if (expected !== row.codeHash) {
    await prisma.consoleLoginOtp.update({
      where: { id: row.id },
      data: { verifyAttempts: { increment: 1 } },
    });
    return null;
  }

  await prisma.consoleLoginOtp.update({
    where: { id: row.id },
    data: { consumedAt: new Date() },
  });

  await ensureBootstrapOperatorRoleByEmail(emailRaw);
  const user = await prisma.user.findFirst({
    where: { email: { equals: emailNorm, mode: "insensitive" }, role: "OPERATOR" },
    select: { id: true, email: true, name: true, image: true },
  });
  return user ?? null;
}
