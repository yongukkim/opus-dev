/**
 * ISO 27001 A.13.1.3 / A.18.1.4 (§6, §7) — transactional email via Resend; no PII in application logs beyond ops necessity.
 * KO: OTP 평문은 프로덕션 로그에 남기지 않으며, 이메일은 재위탁(Resend) 경로로만 발송한다.
 * Ja: OTP平文は本番ログに残さず、メールは再委託(Resend)経由のみ送信する。
 * EN: Do not log OTP plaintext in production; email is sent only via the Resend subprocessor path.
 */
export async function sendConsoleOtpEmail(to: string, code: string): Promise<{ ok: boolean; skipped?: string }> {
  const key = process.env["RESEND_API_KEY"]?.trim();
  const from =
    process.env["OPUS_CONSOLE_EMAIL_FROM"]?.trim() ?? "OPUS Console <onboarding@resend.dev>";

  if (!key) {
    if (process.env["NODE_ENV"] !== "production") {
      return { ok: true, skipped: "dev_no_provider" };
    }
    console.error("[console-otp] RESEND_API_KEY missing in production");
    return { ok: false };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Your OPUS Console sign-in code",
      text: `Your one-time code is ${code}. It expires in 10 minutes. If you did not request this, you can ignore this message.`,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[console-otp] Resend error", res.status, body.slice(0, 500));
    return { ok: false };
  }
  return { ok: true };
}
