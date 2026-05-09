import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const KEY = "opus.device.id.v1";

function randomId(): string {
  const r = Math.random().toString(36).slice(2);
  const t = Date.now().toString(36);
  return `dev-${Platform.OS}-${t}-${r}`;
}

export async function getOrCreateDeviceId(): Promise<string> {
  if (Platform.OS === "web") {
    try {
      const existing = typeof localStorage !== "undefined" ? localStorage.getItem(KEY) : null;
      if (existing?.trim()) return existing.trim();
      const id = randomId();
      if (typeof localStorage !== "undefined") localStorage.setItem(KEY, id);
      return id;
    } catch {
      return randomId();
    }
  }
  const existing = await SecureStore.getItemAsync(KEY);
  if (existing?.trim()) return existing.trim();
  const id = randomId();
  await SecureStore.setItemAsync(KEY, id, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY });
  return id;
}

export async function deleteDeviceId(): Promise<void> {
  try {
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") localStorage.removeItem(KEY);
      return;
    }
    await SecureStore.deleteItemAsync(KEY);
  } catch {
    // ignore
  }
}

