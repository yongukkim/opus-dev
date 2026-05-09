import { AUX_LEDGER_FILES } from "@/lib/ledgerStores";
import { appendJsonl } from "@/lib/privateStorage";

export type ViewerTileSessionAuditRow = {
  id: string;
  occurredAt: string;
  userId: string;
  submissionId: string;
  /** coarse class only — not a device fingerprint */
  clientClass: "mobile_web" | "unknown";
  outcome: "issued" | "denied_mobile_required" | "denied_forbidden";
};

/**
 * ISO 27001 A.12.4.1 (§5) / A.18.1.4 (§7)
 * KO: 타일 세션 발급 시 최소 감사 행만 append-only로 남기고, 원시 UA 전문은 저장하지 않습니다.
 * JA: タイルセッション発行時に最小限の監査行のみを追記し、生UA全文は保存しません。
 * EN: Append-only minimal audit rows for tile-session grants; raw UA strings are not stored.
 */
export async function appendViewerTileSessionAudit(row: Omit<ViewerTileSessionAuditRow, "id" | "occurredAt">): Promise<void> {
  const occurredAt = new Date().toISOString();
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  const full: ViewerTileSessionAuditRow = { id, occurredAt, ...row };
  await appendJsonl(AUX_LEDGER_FILES.viewerTileSessionAudit, full);
}
