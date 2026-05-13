import { createHash, randomBytes } from "node:crypto";

/**
 * ISO 27001 A.10.1.1 / A.9.4.2 (§3, §2) — store only SHA-256 of email verification secrets.
 * KO: 이메일 인증 토큰 평문은 DB에 넣지 않고 SHA-256 해시만 저장한다.
 * JA: メール検証トークンの平文はDBに入れず、SHA-256ハッシュのみを保存する。
 * EN: Never persist plaintext email verification tokens — only SHA-256 hashes in the database.
 */
const TOKEN_BYTES = 32;

export function newPlainVerificationToken(): string {
  return randomBytes(TOKEN_BYTES).toString("hex");
}

export function hashVerificationToken(plain: string): string {
  return createHash("sha256").update(plain, "utf8").digest("hex");
}

export function isLikelyVerificationTokenParam(value: string): boolean {
  return /^[a-f0-9]{64}$/i.test(value);
}
