import { readFile } from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { resolveArtworkBySlug } from "@/lib/artworksCatalog";
import { resolvePublicArtworkPath } from "@/lib/catalogImageServe";
import { verifyMobileAssetLeaseTokenV1 } from "@/lib/mobileAssetLease";
import { readActorFromRequest } from "@/lib/authContext";
import { getActiveDeviceState } from "@/lib/deviceBinding";

export const runtime = "nodejs";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
function rateLimitKey(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
function allowRequest(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now >= b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (b.count >= limit) return false;
  b.count += 1;
  return true;
}

/**
 * Mobile-only asset download (demo scaffold).
 *
 * ISO 27001 / OPUS Security Coding Standards
 * - A.9.4.2 (§2) Strong authentication & session
 *   KO: 다운로드는 lease 토큰 검증 후에만 허용되며, 만료(7일) 시 재발급이 필요합니다.
 *   JA: ダウンロードはleaseトークン検証後のみ許可し、期限(7日)後は再発行が必要です。
 *   EN: Downloads require a valid lease token; expiry (7 days) forces re-issuance.
 * - A.9.2.1 (§4) Least Privilege RBAC
 *   KO: 토큰의 userId와 요청 actor userId를 일치시켜 타 사용자 전송을 제한합니다.
 *   JA: トークンのuserIdとリクエストactor userIdを一致させ、他者への転送を制限します。
 *   EN: Bind token userId to request actor userId to reduce token sharing.
 * - A.13.1.3 (§6) API Security
 *   KO: 모바일 전용 경로로 분리하고 X-Robots-Tag로 색인 노출을 줄입니다.
 *   JA: モバイル専用経路に分離し、X-Robots-Tagでインデックス露出を抑えます。
 *   EN: Separate mobile-only path and add X-Robots-Tag to reduce indexing exposure.
 * - A.13.1.3 (§6) API Security (rate limiting)
 *   KO: 대량 다운로드 남용을 줄이기 위해 단순 rate limit(메모리)을 적용합니다(운영 시 게이트웨이로 대체).
 *   JA: 大量ダウンロードの濫用を抑えるため簡易レート制限（メモリ）を適用します（本番はゲートウェイで代替）。
 *   EN: Apply a simple in-memory rate limit to reduce abuse (production should use a gateway/WAF).
 */
export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ slug: string }> },
): Promise<Response> {
  if (!allowRequest(rateLimitKey(request), 60, 60_000)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }
  const { slug } = await ctx.params;
  const actor = readActorFromRequest(request);
  if (!actor || actor.role !== "collector") {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const deviceId = request.headers.get("x-opus-device-id")?.trim() ?? "";
  if (!deviceId) {
    return NextResponse.json({ ok: false, error: "invalid_device" }, { status: 400 });
  }
  const deviceState = await getActiveDeviceState(actor.userId);
  if (!deviceState.activeDeviceId || deviceState.activeDeviceId !== deviceId) {
    return NextResponse.json({ ok: false, error: "device_revoked" }, { status: 401 });
  }

  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : "";
  const verified = token ? verifyMobileAssetLeaseTokenV1(token) : null;
  if (!verified || verified.userId !== actor.userId || verified.deviceId !== deviceId || verified.artworkSlug !== slug) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const resolved = await resolveArtworkBySlug(slug);
  if (!resolved) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  // TODO: replace with protected original storage (not public/) once mobile pipeline is ready.
  let absPath: string;
  try {
    absPath = resolvePublicArtworkPath(resolved.base, resolved.file);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_path" }, { status: 400 });
  }

  try {
    const body = await readFile(absPath);
    return new NextResponse(new Uint8Array(body), {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename=\"${resolved.file}\"`,
        "Cache-Control": "private, max-age=0, no-store",
        "X-Robots-Tag": "noindex, noimageindex",
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
}

