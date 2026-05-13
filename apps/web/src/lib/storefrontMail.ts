/**
 * ISO 27001 A.10.1.1 / A.13.1.3 (CLAUDE.md §3, §6) — storefront email verification only; SMTP from env.
 * KO: 스토어프론트 이메일 인증 링크만 발송하며 SMTP 자격 증명은 환경 변수로만 받는다.
 * JA: ストアフロントのメール検証リンクのみ送信し、SMTP資格情報は環境変数のみから受け取る。
 * EN: Sends storefront verification links only; SMTP credentials come from environment variables only.
 */
export async function sendStorefrontVerificationEmail(to: string, verifyUrl: string): Promise<void> {
  const smtpUrl = process.env["OPUS_WEB_SMTP_URL"]?.trim();
  const from = process.env["OPUS_WEB_MAIL_FROM"]?.trim();
  if (!smtpUrl || !from) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("OPUS_WEB_SMTP_URL and OPUS_WEB_MAIL_FROM are required in production");
    }
    console.info("[web] verification link (OPUS_WEB_SMTP_URL not configured):", verifyUrl);
    return;
  }
  const nodemailer = await import("nodemailer");
  const transport = nodemailer.createTransport(smtpUrl);
  await transport.sendMail({
    from,
    to,
    subject: "Verify your OPUS email",
    text: `Open this link to verify your email (link expires in 48 hours):\n\n${verifyUrl}\n\nIf you did not create an OPUS account, you can ignore this message.\n`,
  });
}
