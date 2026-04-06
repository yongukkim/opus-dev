import { NextRequest, NextResponse } from "next/server";
import { readActorFromRequest } from "@/lib/authContext";
import { getActiveDeviceState } from "@/lib/deviceBinding";

export const runtime = "nodejs";

/**
 * Device status polling endpoint (push-less fallback).
 *
 * ISO 27001 / OPUS Security Coding Standards
 * - A.9.4.2 (§2) Session management
 *   KO: 디바이스가 revoked 상태면 앱은 즉시 로컬 자산/키를 삭제(wipe)하고 로그아웃해야 합니다.
 *   JA: 端末が revoked の場合、アプリは直ちにローカル資産/鍵を削除(wipe)しログアウトします。
 *   EN: If the device is revoked, the app must wipe local assets/keys and log out immediately.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const actor = readActorFromRequest(request);
  if (!actor || actor.role !== "collector") {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const deviceId = request.headers.get("x-opus-device-id")?.trim() ?? "";
  if (!deviceId) {
    return NextResponse.json({ ok: false, error: "invalid_device" }, { status: 400 });
  }

  const state = await getActiveDeviceState(actor.userId);
  const isActive = state.activeDeviceId === deviceId;
  const revokedInfo = state.revoked[deviceId];

  return NextResponse.json(
    {
      ok: true,
      active: isActive,
      revoked: Boolean(revokedInfo) || (!isActive && state.activeDeviceId != null),
      epoch: state.epoch,
      activeDeviceId: state.activeDeviceId,
    },
    { status: 200, headers: { "X-Robots-Tag": "noindex, noimageindex" } },
  );
}

