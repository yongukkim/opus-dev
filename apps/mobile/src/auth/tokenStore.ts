/**
 * ISO 27001 A.9.4.2 / A.10.1.1 (CLAUDE.md §2, §3)
 * KO: access/refresh 토큰을 SecureStore(Keychain/Keystore)에 저장·삭제한다.
 * JA: access/refresh トークンを SecureStore（Keychain/Keystore）に保存・削除する。
 * EN: Persist access/refresh tokens in SecureStore (Keychain/Keystore) with strict access flags.
 */
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Web fallback: SecureStore is not available on web, use localStorage.
const webStore = {
  getItemAsync: async (key: string) => {
    try { return typeof localStorage !== "undefined" ? localStorage.getItem(key) : null; } catch { return null; }
  },
  setItemAsync: async (key: string, value: string) => {
    try { if (typeof localStorage !== "undefined") localStorage.setItem(key, value); } catch {}
  },
  deleteItemAsync: async (key: string) => {
    try { if (typeof localStorage !== "undefined") localStorage.removeItem(key); } catch {}
  },
};

const store = Platform.OS === "web" ? webStore : SecureStore;

const KEYS = {
  accessToken: "opus.auth.access.v1",
  refreshToken: "opus.auth.refresh.v1",
  userId: "opus.auth.userId.v1",
  userEmail: "opus.auth.email.v1",
  userName: "opus.auth.name.v1",
  userRole: "opus.auth.role.v1",
} as const;

const SECURE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

export type StoredUser = {
  id: string;
  email: string;
  name: string | null;
  role: "collector" | "artist" | "operator";
};

export async function saveTokens(
  accessToken: string,
  refreshToken: string,
  user: StoredUser,
): Promise<void> {
  await Promise.all([
    store.setItemAsync(KEYS.accessToken, accessToken, SECURE_OPTIONS),
    store.setItemAsync(KEYS.refreshToken, refreshToken, SECURE_OPTIONS),
    store.setItemAsync(KEYS.userId, user.id, SECURE_OPTIONS),
    store.setItemAsync(KEYS.userEmail, user.email, SECURE_OPTIONS),
    store.setItemAsync(KEYS.userName, user.name ?? "", SECURE_OPTIONS),
    store.setItemAsync(KEYS.userRole, user.role, SECURE_OPTIONS),
  ]);
}

export async function loadTokens(): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
  user: StoredUser | null;
}> {
  const [accessToken, refreshToken, id, email, name, role] = await Promise.all([
    store.getItemAsync(KEYS.accessToken),
    store.getItemAsync(KEYS.refreshToken),
    store.getItemAsync(KEYS.userId),
    store.getItemAsync(KEYS.userEmail),
    store.getItemAsync(KEYS.userName),
    store.getItemAsync(KEYS.userRole),
  ]);

  const user =
    id && email && role
      ? ({ id, email, name: name || null, role } as StoredUser)
      : null;

  return { accessToken, refreshToken, user };
}

export async function clearTokens(): Promise<void> {
  await Promise.all(Object.values(KEYS).map((k) => store.deleteItemAsync(k).catch(() => {})));
}
