import Stripe from "stripe";

let stripeSingleton: Stripe | null = null;

/**
 * ISO 27001 A.10.1.1 (§3), A.18.1.4 (§7)
 * KO: Stripe 비밀키는 환경변수에서만 읽고, 클라이언트·로그에 노출하지 않습니다.
 * JA: Stripe秘密鍵は環境変数からのみ読み取り、クライアント・ログに露出しません。
 * EN: Stripe secret key is read only from environment variables and is never exposed to clients or logs.
 */
export function getStripeServer(): Stripe | null {
  const key = process.env["STRIPE_SECRET_KEY"]?.trim();
  if (!key) return null;
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(key, { typescript: true });
  }
  return stripeSingleton;
}

export function getStripeWebhookSecret(): string {
  return process.env["STRIPE_WEBHOOK_SECRET"]?.trim() ?? "";
}
