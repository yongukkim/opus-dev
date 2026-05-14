/**
 * ISO 27001 A.10.1.1 / A.13.1.3 (CLAUDE.md §3, §6) — storefront verification email only; secrets from env.
 * KO: 인증 링크 메일만 발송하며, Resend(HTTPS) 또는 SMTP 자격 증명은 환경 변수로만 받는다.
 * JA: 検証リンクメールのみ送信し、Resend(HTTPS)またはSMTP資格情報は環境変数のみから受け取る。
 * EN: Sends verification links only; Resend (HTTPS) or SMTP credentials come from environment variables only.
 *
 * Delivery order (production must have one path):
 * 1) `OPUS_WEB_RESEND_API_KEY` or `RESEND_API_KEY` + `OPUS_WEB_MAIL_FROM` — Resend REST API.
 * 2) `OPUS_WEB_SMTP_URL` + `OPUS_WEB_MAIL_FROM` — nodemailer SMTP.
 * Development: if neither is configured, logs the link to stdout (no mail).
 */
const VERIFY_SUBJECT = "Verify your OPUS email";

/** Thrown when production has no Resend/SMTP + from configured (register should map to user-facing copy). */
export class StorefrontMailNotConfiguredError extends Error {
  override readonly name = "StorefrontMailNotConfiguredError";
  constructor() {
    super("Storefront mail not configured");
  }
}

/** Thrown when Resend or SMTP rejects the send (register rolls back user). */
export class StorefrontMailSendError extends Error {
  override readonly name = "StorefrontMailSendError";
  constructor(message: string) {
    super(message);
  }
}

function verifyBody(verifyUrl: string): string {
  return `Open this link to verify your email (link expires in 48 hours):\n\n${verifyUrl}\n\nIf you did not create an OPUS account, you can ignore this message.\n`;
}

function resendApiKey(): string | undefined {
  return (
    process.env["OPUS_WEB_RESEND_API_KEY"]?.trim() ||
    process.env["RESEND_API_KEY"]?.trim() ||
    undefined
  );
}

async function sendViaResend(to: string, from: string, verifyUrl: string, apiKey: string): Promise<void> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 20_000);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: controller.signal,
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
      throw new StorefrontMailSendError(`Resend HTTP ${res.status}: ${detail.slice(0, 800)}`);
    }
  } catch (e) {
    if (e instanceof StorefrontMailSendError) throw e;
    if (e instanceof Error && e.name === "AbortError") {
      throw new StorefrontMailSendError("Resend request timed out");
    }
    throw new StorefrontMailSendError(e instanceof Error ? e.message : String(e));
  } finally {
    clearTimeout(t);
  }
}

export async function sendStorefrontVerificationEmail(to: string, verifyUrl: string): Promise<void> {
  const from = process.env["OPUS_WEB_MAIL_FROM"]?.trim();
  const resendKey = resendApiKey();
  const smtpUrl = process.env["OPUS_WEB_SMTP_URL"]?.trim();

  const isProd = process.env.NODE_ENV === "production";

  if (resendKey && from) {
    await sendViaResend(to, from, verifyUrl, resendKey);
    return;
  }

  if (smtpUrl && from) {
    try {
      const nodemailer = await import("nodemailer");
      const transport = nodemailer.createTransport(smtpUrl);
      await transport.sendMail({
        from,
        to,
        subject: VERIFY_SUBJECT,
        text: verifyBody(verifyUrl),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new StorefrontMailSendError(`SMTP: ${msg}`);
    }
    return;
  }

  if (!isProd) {
    console.info("[web] verification link (no Resend/SMTP + OPUS_WEB_MAIL_FROM):", verifyUrl);
    return;
  }

  throw new StorefrontMailNotConfiguredError();
}
