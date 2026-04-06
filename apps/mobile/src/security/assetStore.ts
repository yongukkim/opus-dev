import * as FileSystem from "expo-file-system";
import { decryptBytesV1, encryptBytesV1, type EncryptedBlobV1 } from "./assetCrypto";

const ROOT_DIR = `${(FileSystem as any).documentDirectory ?? ""}opus_assets/`;

async function ensureRoot(): Promise<void> {
  const info = await FileSystem.getInfoAsync(ROOT_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(ROOT_DIR, { intermediates: true });
  }
}

function metaPath(assetId: string): string {
  return `${ROOT_DIR}${assetId}.json`;
}

export type StoredAssetMetaV1 = {
  v: 1;
  assetId: string;
  /** ISO string */
  downloadedAt: string;
  /** ISO string */
  expiresAt: string;
  /** Encrypted payload (base64 encoded parts) */
  payload: EncryptedBlobV1;
};

/**
 * Store encrypted bytes + TTL metadata.
 *
 * ISO 27001 A.10.1.1 (§3)
 * KO: 저장된 파일은 암호화된 JSON 메타 형태로만 남기고, 평문은 즉시 폐기합니다.
 * JA: 保存は暗号化JSONメタのみとし、平文は直ちに破棄します。
 * EN: Persist only encrypted JSON metadata and discard plaintext immediately.
 */
export async function storeEncryptedAssetV1(args: {
  assetId: string;
  plainBytes: Uint8Array;
  expiresAt: string;
}): Promise<StoredAssetMetaV1> {
  await ensureRoot();
  const payload = await encryptBytesV1(args.plainBytes);
  const meta: StoredAssetMetaV1 = {
    v: 1,
    assetId: args.assetId,
    downloadedAt: new Date().toISOString(),
    expiresAt: args.expiresAt,
    payload,
  };
  await FileSystem.writeAsStringAsync(metaPath(args.assetId), JSON.stringify(meta), {
    // Some Expo typings differ; runtime accepts "utf8".
    encoding: "utf8" as any,
  });
  return meta;
}

export async function loadStoredAssetMeta(assetId: string): Promise<StoredAssetMetaV1 | null> {
  try {
    const raw = await FileSystem.readAsStringAsync(metaPath(assetId), { encoding: "utf8" as any });
    const parsed = JSON.parse(raw) as StoredAssetMetaV1;
    if (parsed?.v !== 1 || parsed.assetId !== assetId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isExpired(meta: StoredAssetMetaV1, now = new Date()): boolean {
  const exp = new Date(meta.expiresAt);
  if (Number.isNaN(exp.getTime())) return true;
  return now.getTime() >= exp.getTime();
}

/**
 * Decrypt asset bytes into memory (for MVP viewer). Later we should decrypt to a temp file and stream.
 *
 * ISO 27001 A.10.1.1 (§3)
 * KO: 복호화 결과는 필요 시점에만 메모리로 가져오며, 장기 저장(평문 파일)은 만들지 않습니다.
 * JA: 復号結果は必要時のみメモリに展開し、平文ファイルを永続化しません。
 * EN: Decrypt only on-demand in memory; do not persist plaintext files.
 */
export async function decryptStoredAssetBytes(meta: StoredAssetMetaV1): Promise<Uint8Array> {
  return await decryptBytesV1(meta.payload);
}

export async function updateLeaseExpiresAt(assetId: string, expiresAt: string): Promise<boolean> {
  const meta = await loadStoredAssetMeta(assetId);
  if (!meta) return false;
  const next: StoredAssetMetaV1 = { ...meta, expiresAt };
  await FileSystem.writeAsStringAsync(metaPath(assetId), JSON.stringify(next), {
    encoding: "utf8" as any,
  });
  return true;
}

export async function deleteAllStoredAssets(): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(ROOT_DIR);
    if (info.exists) {
      await FileSystem.deleteAsync(ROOT_DIR, { idempotent: true });
    }
  } catch {
    // ignore
  }
}

