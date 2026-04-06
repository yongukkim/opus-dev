import { wipeAndReloadApp } from "./wipe";

export async function pollAndWipeIfRevoked(args: {
  apiBase: string;
  userId: string;
  deviceId: string;
}): Promise<{ revoked: boolean; active: boolean; epoch: number | null }> {
  const res = await fetch(`${args.apiBase}/api/mobile/device/status`, {
    method: "GET",
    headers: {
      "x-opus-user-id": args.userId,
      "x-opus-role": "collector",
      "x-opus-device-id": args.deviceId,
    },
  });
  const json = (await res.json().catch(() => ({}))) as any;
  const revoked = Boolean(json.revoked);
  if (revoked) {
    await wipeAndReloadApp();
  }
  return { revoked, active: Boolean(json.active), epoch: typeof json.epoch === "number" ? json.epoch : null };
}

