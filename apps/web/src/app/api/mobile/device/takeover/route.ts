import { NextRequest, NextResponse } from "next/server";
import { readActorFromRequest } from "@/lib/authContext";
import { appendDeviceBindingEvent, getActiveDeviceState } from "@/lib/deviceBinding";

function requireString(obj: any, key: string, maxLen: number): string {
  const v = obj?.[key];
  if (typeof v !== "string") throw new Error(`invalid:${key}`);
  const s = v.trim();
  if (!s || s.length > maxLen) throw new Error(`invalid:${key}`);
  return s;
}

export const runtime = "nodejs";

/**
 * Confirm takeover: revoke old active device, activate new device, and trigger wipe request.
 *
 * ISO 27001 / OPUS Security Coding Standards
 * - A.9.4.2 (§2) Session management
 *   KO: takeover 시 기존 디바이스의 세션/lease는 무효화되며, 앱은 wipe를 수행해야 합니다.
 *   JA: takeover 時に旧端末のセッション/leaseは無効化され、アプリは wipe を実行します。
 *   EN: Takeover invalidates the old device session/leases and requires the app to wipe local data.
 * - A.12.4.1 (§5) Logging/auditing
 *   KO: 이벤트는 append-only JSONL로 남겨 추적성을 확보합니다(운영 시 감사 로그로 이전).
 *   JA: イベントはappend-only JSONLに記録し追跡性を確保します（本番は監査ログへ）。
 *   EN: Append-only JSONL events preserve traceability (production should use audit logging).
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const actor = readActorFromRequest(request);
    if (!actor || actor.role !== "collector") {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const deviceId = requireString(body, "deviceId", 160);

    const state = await getActiveDeviceState(actor.userId);
    const old = state.activeDeviceId;
    const nextEpoch = state.epoch + 1;

    if (old && old !== deviceId) {
      await appendDeviceBindingEvent({
        v: 1,
        type: "revoke",
        createdAt: new Date().toISOString(),
        userId: actor.userId,
        deviceId: old,
        epoch: nextEpoch,
        reason: "takeover",
      });
    }

    await appendDeviceBindingEvent({
      v: 1,
      type: "activate",
      createdAt: new Date().toISOString(),
      userId: actor.userId,
      deviceId,
      epoch: nextEpoch,
    });

    // TODO(push): send wipe request push to old device's pushToken.
    return NextResponse.json({ ok: true, status: "active", revokedDeviceId: old && old !== deviceId ? old : null }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }
}

