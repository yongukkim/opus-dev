import * as SecureStore from "expo-secure-store";
import nacl from "tweetnacl";
import * as naclUtil from "tweetnacl-util";

const KEY_NAME = "opus.asset.key.v1";

function randomBytes(n: number): Uint8Array {
  return nacl.randomBytes(n);
}

async function getOrCreateKey(): Promise<Uint8Array> {
  const existing = await SecureStore.getItemAsync(KEY_NAME);
  if (existing) {
    return naclUtil.decodeBase64(existing);
  }
  const key = randomBytes(nacl.secretbox.keyLength);
  await SecureStore.setItemAsync(KEY_NAME, naclUtil.encodeBase64(key), {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  });
  return key;
}

export type EncryptedBlobV1 = {
  v: 1;
  nonceB64: string;
  boxB64: string;
};

/**
 * Encrypt bytes for at-rest storage in app sandbox.
 *
 * ISO 27001 A.10.1.1 (§3)
 * KO: 다운로드 자산은 앱 내부 저장 시 암호화하여, 외부 파일 복사만으로는 원문이 노출되지 않게 합니다.
 * JA: ダウンロード資産はアプリ内保存時に暗号化し、ファイルコピーのみでは復号できないようにします。
 * EN: Encrypt downloaded assets at rest so file copying alone does not expose the plaintext.
 */
export async function encryptBytesV1(plain: Uint8Array): Promise<EncryptedBlobV1> {
  const key = await getOrCreateKey();
  const nonce = randomBytes(nacl.secretbox.nonceLength);
  const box = nacl.secretbox(plain, nonce, key);
  return { v: 1, nonceB64: naclUtil.encodeBase64(nonce), boxB64: naclUtil.encodeBase64(box) };
}

export async function decryptBytesV1(enc: EncryptedBlobV1): Promise<Uint8Array> {
  const key = await getOrCreateKey();
  const nonce = naclUtil.decodeBase64(enc.nonceB64);
  const box = naclUtil.decodeBase64(enc.boxB64);
  const out = nacl.secretbox.open(box, nonce, key);
  if (!out) throw new Error("decrypt_failed");
  return out;
}

export async function deleteAssetKey(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(KEY_NAME);
  } catch {
    // ignore
  }
}

