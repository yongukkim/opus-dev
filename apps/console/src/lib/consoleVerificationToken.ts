import { createHash, randomBytes } from "node:crypto";

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
