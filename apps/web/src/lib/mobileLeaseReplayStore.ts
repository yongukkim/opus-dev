import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { AUX_LEDGER_FILES } from "@/lib/ledgerStores";
import { appendJsonl } from "@/lib/privateStorage";

const MOBILE_LEASE_USES_FILE = AUX_LEDGER_FILES.mobileLeaseUses;

type MobileLeaseUseEvent = {
  v: 1;
  type: "consume";
  at: string;
  jti: string;
  userId: string;
  deviceId: string;
  artworkSlug: string;
  expiresAt: string;
};

/**
 * ISO 27001 A.13.1.3 (§6) API Security / replay mitigation
 * KO: lease 토큰은 고유 식별자(jti) 기준으로 1회만 소비되어 재사용(재생) 요청을 차단합니다.
 * JA: leaseトークンは一意識別子(jti)で1回のみ消費し、再利用(リプレイ)要求を遮断します。
 * EN: Lease tokens are consumed once by unique jti to block replay reuse.
 */
export async function consumeMobileLeaseJtiOnce(input: {
  jti: string;
  userId: string;
  deviceId: string;
  artworkSlug: string;
  expiresAt: string;
}): Promise<boolean> {
  const jti = input.jti.trim();
  if (!jti) return false;
  try {
    const raw = await readFile(MOBILE_LEASE_USES_FILE, "utf8");
    const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      try {
        const ev = JSON.parse(line) as MobileLeaseUseEvent;
        if (ev?.v === 1 && ev.type === "consume" && ev.jti === jti) {
          return false;
        }
      } catch {
        // Ignore malformed rows to avoid breaking token consumption path.
      }
    }
  } catch {
    // Missing file is expected on first use.
  }

  await appendJsonl(MOBILE_LEASE_USES_FILE, {
    v: 1,
    type: "consume",
    at: new Date().toISOString(),
    jti,
    userId: input.userId,
    deviceId: input.deviceId,
    artworkSlug: input.artworkSlug,
    expiresAt: input.expiresAt,
  } satisfies MobileLeaseUseEvent);
  return true;
}

export function createMobileLeaseJti(): string {
  return randomUUID();
}
