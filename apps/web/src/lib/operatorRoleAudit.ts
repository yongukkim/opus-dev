import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export type RoleAuditRecord = {
  id: string;
  at: string;
  operatorUserId: string;
  targetUserId: string;
  fromRole: "COLLECTOR" | "ARTIST" | "OPERATOR";
  toRole: "COLLECTOR" | "ARTIST" | "OPERATOR";
};

const STORAGE_ROOT = path.join(process.cwd(), "storage");
const AUDIT_FILE = path.join(STORAGE_ROOT, "operator-role-audit.jsonl");

/**
 * ISO 27001 A.12.4.1 (§5) Audit logging
 * KO: 운영자 권한 변경은 별도 감사 로그(jsonl)로 남겨 사후 추적 가능성을 보장합니다.
 * JA: 運営者の権限変更は専用監査ログ(jsonl)に記録し、事後追跡性を確保します。
 * EN: Operator role changes are written to a dedicated jsonl audit log for traceability.
 */
export async function appendOperatorRoleAudit(record: Omit<RoleAuditRecord, "id" | "at">): Promise<void> {
  await mkdir(STORAGE_ROOT, { recursive: true });
  const payload: RoleAuditRecord = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
    at: new Date().toISOString(),
    ...record,
  };
  await writeFile(AUDIT_FILE, `${JSON.stringify(payload)}\n`, { flag: "a", encoding: "utf8" });
}
