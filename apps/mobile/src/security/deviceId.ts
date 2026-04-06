import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const KEY = "opus.device.id.v1";

function randomId(): string {
  const r = Math.random().toString(36).slice(2);
  const t = Date.now().toString(36);
  return `dev-${Platform.OS}-${t}-${r}`;
}

export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await SecureStore.getItemAsync(KEY);
  if (existing?.trim()) return existing.trim();
  const id = randomId();
  await SecureStore.setItemAsync(KEY, id, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY });
  return id;
}

export async function deleteDeviceId(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch {
    // ignore
  }
}

