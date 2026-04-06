import { deleteAssetKey } from "./assetCrypto";
import { deleteAllStoredAssets } from "./assetStore";
import { deleteDeviceId } from "./deviceId";

/**
 * Best-effort local wipe for single-device policy.
 *
 * ISO 27001 A.9.4.2 (§2)
 * KO: 디바이스가 revoked 되면 로컬 자산/키를 즉시 삭제하여 앱 외부 유출 가능성을 낮춥니다.
 * JA: 端末が revoked の場合、ローカル資産/鍵を即時削除し漏えい可能性を低減します。
 * EN: When a device is revoked, wipe local assets/keys immediately to reduce exfiltration risk.
 */
export async function wipeLocalSecureData(): Promise<void> {
  await deleteAssetKey();
  await deleteAllStoredAssets();
  // In production we likely keep a stable device id, but for demo it's ok to reset.
  await deleteDeviceId();
}

export async function wipeAndReloadApp(): Promise<void> {
  await wipeLocalSecureData();
  // TODO: add navigation reset / forced sign-out screen when auth is wired.
}

