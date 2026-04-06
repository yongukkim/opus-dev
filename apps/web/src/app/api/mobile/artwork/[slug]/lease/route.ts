import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { hasDemoSessionFromCookies } from "@/lib/demoSession";
import { readActorFromRequest } from "@/lib/authContext";
import { resolveArtworkBySlug } from "@/lib/artworksCatalog";
import { signMobileAssetLeaseTokenV1 } from "@/lib/mobileAssetLease";

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
 * Mobile-only high-fidelity viewing lease (demo scaffold).
 *
 * ISO 27001 / OPUS Security Coding Standards
 * - A.9.4.2 (§2) Strong authentication & session
 *   KO: 모바일 고화질 자산은 세션/토큰 기반으로만 접근 가능하며, 7일 TTL lease로 재검증을 강제합니다.
 *   JA: モバイル高画質資産はセッション/トークンでのみアクセス可能とし、7日TTLのleaseで再検証を強制します。
 *   EN: Mobile high-fidelity assets require session/token access; a 7-day TTL lease enforces revalidation.
 * - A.9.2.1 (§4) Least Privilege / ownership
 *   KO: 발급은 소유자(collector)만 허용하는 것을 전제로 하며, 데모에서는 최소 권한 역할을 검증합니다.
 *   JA: 発行は所有者（collector）のみを前提とし、デモでは最小権限の役割を検証します。
 *   EN: Issuance is intended for owners (collector); demo validates least-privilege role.
 * - A.14.2.1 (§1) Input validation
 *   KO: slug는 서버에서 디코딩/허용 확장자 검증(`resolveArtworkBySlug`)을 통과해야 합니다.
 *   JA: slugはサーバ側でデコード/拡張子検証（resolveArtworkBySlug）を通過する必要があります。
 *   EN: Slug must pass server-side decode/extension validation via resolveArtworkBySlug.
 * - A.13.1.3 (§6) API Security (rate limiting)
 *   KO: 대량 발급 남용을 줄이기 위해 단순 rate limit(메모리)을 적용합니다(운영 시 게이트웨이로 대체).
 *   JA: 大量発行の濫用を抑えるため簡易レート制限（メモリ）を適用します（本番はゲートウェイで代替）。
 *   EN: Apply a simple in-memory rate limit to reduce abuse (production should use a gateway/WAF).
 */
export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ slug: string }> },
): Promise<Response> {
  if (!allowRequest(rateLimitKey(request), 30, 60_000)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }
  const { slug } = await ctx.params;

  // Demo gate: require demo session cookie (web) or explicit mobile-demo header (local testing).
  const cookieStore = await cookies();
  const mobileDemo = request.headers.get("x-opus-mobile-demo") === "1";
  if (!mobileDemo && !hasDemoSessionFromCookies(cookieStore)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const actor = readActorFromRequest(request);
  if (!actor || actor.role !== "collector") {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const resolved = await resolveArtworkBySlug(slug);
  if (!resolved) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  // TODO(Chronicle): enforce edition ownership for actor.userId here.
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const token = signMobileAssetLeaseTokenV1({
    v: 1,
    userId: actor.userId,
    artworkSlug: slug,
    expiresAt,
  });

  return NextResponse.json(
    {
      ok: true,
      expiresAt,
      token,
      downloadUrl: `/api/mobile/artwork/${encodeURIComponent(slug)}/download`,
    },
    {
      status: 201,
      headers: { "X-Robots-Tag": "noindex, noimageindex" },
    },
  );
}

