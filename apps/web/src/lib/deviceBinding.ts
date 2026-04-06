import { readFile } from "node:fs/promises";
import path from "node:path";
import { appendJsonl } from "@/lib/privateStorage";

const STORAGE_ROOT = path.join(process.cwd(), "storage");
export const DEVICE_BINDINGS_FILE = path.join(STORAGE_ROOT, "device-bindings.jsonl");

export type DeviceBindingEvent =
  | {
      v: 1;
      type: "register";
      createdAt: string;
      userId: string;
      deviceId: string;
      platform: "ios" | "android";
      pushToken: string;
    }
  | {
      v: 1;
      type: "activate";
      createdAt: string;
      userId: string;
      deviceId: string;
      epoch: number;
    }
  | {
      v: 1;
      type: "revoke";
      createdAt: string;
      userId: string;
      deviceId: string;
      epoch: number;
      reason: "takeover";
    };

export type DeviceRecord = {
  deviceId: string;
  platform: "ios" | "android";
  pushToken: string;
  lastSeenAt: string;
};

export type ActiveDeviceState = {
  userId: string;
  activeDeviceId: string | null;
  epoch: number;
  devices: Record<string, DeviceRecord>;
  revoked: Record<string, { revokedAt: string; epoch: number; reason: string }>;
};

async function readAllLines(): Promise<DeviceBindingEvent[]> {
  try {
    const raw = await readFile(DEVICE_BINDINGS_FILE, "utf8");
    return raw
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => JSON.parse(l) as DeviceBindingEvent)
      .filter((e) => e?.v === 1);
  } catch {
    return [];
  }
}

export async function appendDeviceBindingEvent(e: DeviceBindingEvent): Promise<void> {
  await appendJsonl(DEVICE_BINDINGS_FILE, e);
}

export async function getActiveDeviceState(userId: string): Promise<ActiveDeviceState> {
  const events = await readAllLines();
  const state: ActiveDeviceState = {
    userId,
    activeDeviceId: null,
    epoch: 0,
    devices: {},
    revoked: {},
  };

  for (const ev of events) {
    if (ev.userId !== userId) continue;
    if (ev.type === "register") {
      state.devices[ev.deviceId] = {
        deviceId: ev.deviceId,
        platform: ev.platform,
        pushToken: ev.pushToken,
        lastSeenAt: ev.createdAt,
      };
    }
    if (ev.type === "activate") {
      state.activeDeviceId = ev.deviceId;
      state.epoch = Math.max(state.epoch, ev.epoch);
      const d = state.devices[ev.deviceId];
      if (d) d.lastSeenAt = ev.createdAt;
    }
    if (ev.type === "revoke") {
      state.revoked[ev.deviceId] = { revokedAt: ev.createdAt, epoch: ev.epoch, reason: ev.reason };
      if (state.activeDeviceId === ev.deviceId) state.activeDeviceId = null;
      state.epoch = Math.max(state.epoch, ev.epoch);
    }
  }

  return state;
}

export function maskDeviceId(deviceId: string): string {
  const t = deviceId.trim();
  if (t.length <= 6) return "······";
  return `···${t.slice(-6)}`;
}

