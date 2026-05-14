/**
 * ISO 27001 A.10.1.1 / A.13.1.3 (CLAUDE.md §3, §6) — storefront verification email only; secrets from env.
 * KO: 인증 링크 메일만 발송하며, Resend(HTTPS) 또는 SMTP 자격 증명은 환경 변수로만 받는다.
 * JA: 検証リンクメールのみ送信し、Resend(HTTPS)またはSMTP資格情報は環境変数のみから受け取る。
 * EN: Sends verification links only; Resend (HTTPS) or SMTP credentials come from environment variables only.
 *
 * Delivery order (production must have one path):
 * 1) `OPUS_WEB_RESEND_API_KEY` + `OPUS_WEB_MAIL_FROM` — Resend REST API (outbound HTTPS; avoids blocked SMTP ports on some hosts).
 * 2) `OPUS_WEB_SMTP_URL` + `OPUS_WEB_MAIL_FROM` — nodemailer SMTP.
 * Development: if neither is configured, logs the link to stdout (no mail).
 */
const VERIFY_SUBJECT = "Verify your OPUS email";

function verifyBody(verifyUrl: string): string {
  return `Open this link to verify your email (link expires in 48 hours):\n\n${verifyUrl}\n\nIf you did not create an OPUS account, you can ignore this message.\n`;
}

async function sendViaResend(to: string, from: string, verifyUrl: string, apiKey: string): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: VERIFY_SUBJECT,
      text: verifyBody(verifyUrl),
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`[web] Resend API error ${res.status}: ${detail.slice(0, 500)}`);
  }
}

export async function sendStorefrontVerificationEmail(to: string, verifyUrl: string): Promise<void> {
  const from = process.env["OPUS_WEB_MAIL_FROM"]?.trim();
  const resendKey = process.env["OPUS_WEB_RESEND_API_KEY"]?.trim();
  const smtpUrl = process.env["OPUS_WEB_SMTP_URL"]?.trim();

  const isProd = process.env.NODE_ENV === "production";

  if (resendKey && from) {
    await sendViaResend(to, from, verifyUrl, resendKey);
    return;
  }

  if (smtpUrl && from) {
    const nodemailer = await import("nodemailer");
    const transport = nodemailer.createTransport(smtpUrl);
    await transport.sendMail({
      from,
      to,
      subject: VERIFY_SUBJECT,
      text: verifyBody(verifyUrl),
    });
    return;
  }

  if (!isProd) {
    console.info("[web] verification link (no OPUS_WEB_RESEND_API_KEY or OPUS_WEB_SMTP_URL):", verifyUrl);
    return;
  }

  throw new Error(
    "[web] Production mail not configured: set OPUS_WEB_MAIL_FROM and either OPUS_WEB_RESEND_API_KEY (recommended) or OPUS_WEB_SMTP_URL",
  );
}
