import { NextRequest, NextResponse } from "next/server";
import { readActorFromRequest } from "@/lib/authContext";
import { appendDeviceBindingEvent, getActiveDeviceState, maskDeviceId } from "@/lib/deviceBinding";

export const runtime = "nodejs";

function requireString(obj: any, key: string, maxLen: number): string {
  const v = obj?.[key];
  if (typeof v !== "string") throw new Error(`invalid:${key}`);
  const s = v.trim();
  if (!s || s.length > maxLen) throw new Error(`invalid:${key}`);
  return s;
}

function requirePlatform(obj: any): "ios" | "android" {
  const p = requireString(obj, "platform", 16);
  if (p !== "ios" && p !== "android") throw new Error("invalid:platform");
  return p;
}

/**
 * Mobile device binding: single active device per user.
 *
 * ISO 27001 / OPUS Security Coding Standards
 * - A.9.4.2 (§2) Session management
 *   KO: 계정당 활성 디바이스 1대 정책을 유지하며, 새 디바이스 등록은 takeover 확인이 필요합니다.
 *   JA: アカウントごとに有効な端末を1台に制限し、新端末は takeover 確認を要求します。
 *   EN: Enforce a single active device per account; new devices require takeover confirmation.
 * - A.18.1.4 (§7) Privacy by design
 *   KO: 디바이스 정보는 최소한(deviceId/pushToken/platform)만 저장합니다.
 *   JA: 端末情報は最小限（deviceId/pushToken/platform）のみ保存します。
 *   EN: Store minimal device info only (deviceId/pushToken/platform).
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const actor = readActorFromRequest(request);
    if (!actor || actor.role !== "collector") {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const deviceId = requireString(body, "deviceId", 160);
    const platform = requirePlatform(body);
    const pushToken = requireString(body, "pushToken", 240);

    await appendDeviceBindingEvent({
      v: 1,
      type: "register",
      createdAt: new Date().toISOString(),
      userId: actor.userId,
      deviceId,
      platform,
      pushToken,
    });

    const state = await getActiveDeviceState(actor.userId);
    if (!state.activeDeviceId) {
      await appendDeviceBindingEvent({
        v: 1,
        type: "activate",
        createdAt: new Date().toISOString(),
        userId: actor.userId,
        deviceId,
        epoch: state.epoch + 1,
      });
      return NextResponse.json({ ok: true, status: "active" }, { status: 201 });
    }

    if (state.activeDeviceId === deviceId) {
      return NextResponse.json({ ok: true, status: "active" }, { status: 200 });
    }

    return NextResponse.json(
      {
        ok: true,
        status: "needs_takeover_confirmation",
        activeDeviceRef: maskDeviceId(state.activeDeviceId),
      },
      { status: 409 },
    );
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }
}

