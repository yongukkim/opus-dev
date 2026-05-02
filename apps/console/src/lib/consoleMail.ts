import nodemailer from "nodemailer";

/**
 * ISO 27001 A.10.1.1 / A.13.1.3 (CLAUDE.md §3, §6) — outbound mail for email verification only; secrets from env.
 * KO: 인증 링크 메일만 발송하며 SMTP 자격 증명은 환경 변수로만 받는다.
 * JA: 認証リンクメールのみ送信し、SMTP資格情報は環境変数のみから受け取る。
 * EN: Sends verification links only; SMTP credentials come from environment variables, never from code.
 */
export async function sendConsoleVerificationEmail(to: string, verifyUrl: string): Promise<void> {
  const smtpUrl = process.env["CONSOLE_SMTP_URL"]?.trim();
  const from = process.env["CONSOLE_MAIL_FROM"]?.trim();
  if (!smtpUrl || !from) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("CONSOLE_SMTP_URL and CONSOLE_MAIL_FROM are required in production");
    }
    console.info("[console] verification link (SMTP not configured):", verifyUrl);
    return;
  }
  const transport = nodemailer.createTransport(smtpUrl);
  await transport.sendMail({
    from,
    to,
    subject: "Verify your OPUS Console email",
    text: `Open this link to verify your email (link expires in 48 hours):\n\n${verifyUrl}\n\nIf you did not request this, you can ignore this message.\n`,
  });
}
