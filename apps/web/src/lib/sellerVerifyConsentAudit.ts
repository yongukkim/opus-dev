import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const STORAGE_ROOT = path.join(process.cwd(), "storage");
const SELLER_VERIFY_CONSENT_FILE = path.join(STORAGE_ROOT, "seller-verify-consent.jsonl");

export type SellerVerifyConsentAuditRecord = {
  id: string;
  /** Server-generated ISO 8601 timestamp at persistence time. */
  agreedAt: string;
  /** Client network identifier from reverse-proxy headers (see getRequestClientIp). */
  ipAddress: string;
  consentCollection: boolean;
  consentSensitiveId: boolean;
  consentThirdParty: boolean;
};

/**
 * ISO 27001 A.12.4.1 (§5) · A.18.1.4 (§7)
 * KO: 판매자 사전 동의는 서버 시각·출처 IP와 함께 append-only 로그로 남긴다.
 * JA: 出品者事前同意はサーバ時刻・接続元IPとともに追記のみのログに残す。
 * EN: Seller pre-consent is appended with server time and client IP for audit trail.
 */
export async function appendSellerVerifyConsentRecord(
  input: Omit<SellerVerifyConsentAuditRecord, "id" | "agreedAt"> & {
    agreedAt?: string;
  },
): Promise<SellerVerifyConsentAuditRecord> {
  await mkdir(STORAGE_ROOT, { recursive: true });
  const agreedAt = input.agreedAt ?? new Date().toISOString();
  const record: SellerVerifyConsentAuditRecord = {
    id: randomUUID(),
    agreedAt,
    ipAddress: input.ipAddress,
    consentCollection: input.consentCollection,
    consentSensitiveId: input.consentSensitiveId,
    consentThirdParty: input.consentThirdParty,
  };
  await appendFile(SELLER_VERIFY_CONSENT_FILE, `${JSON.stringify(record)}\n`, "utf8");
  return record;
}
