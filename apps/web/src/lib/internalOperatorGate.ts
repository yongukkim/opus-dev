import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * ISO 27001 A.9.2.1 / A.13.1.3 — Server-to-server operator actions from the dedicated console app.
 * KO: 공유 비밀으로 콘솔 백엔드만 호출을 허용하고, 실제 감사 주체는 DB에서 OPERATOR로 검증된 acting 사용자 ID로 한정한다.
 * JA: 共有シークレットでコンソールバックエンドのみを許可し、監査上の主体はDBでOPERATOR検証済みの acting ユーザーIDに限定する。
 * EN: Allow only the console backend via a shared secret; bind audit identity to an acting user ID verified as OPERATOR in the DB.
 */
export async function authorizeInternalOperatorRequest(
  req: NextRequest,
): Promise<{ ok: true; actingUserId: string } | { ok: false; status: number; error: string }> {
  const secret = process.env["OPUS_INTERNAL_API_SECRET"]?.trim();
  if (!secret) {
    return { ok: false, status: 503, error: "internal_unconfigured" };
  }
  const authz = req.headers.get("authorization")?.trim();
  if (authz !== `Bearer ${secret}`) {
    return { ok: false, status: 401, error: "unauthorized" };
  }
  const acting = req.headers.get("x-opus-acting-user-id")?.trim();
  if (!acting) {
    return { ok: false, status: 400, error: "acting_user_required" };
  }
  const user = await prisma.user.findUnique({
    where: { id: acting },
    select: { role: true },
  });
  if (!user || user.role !== "OPERATOR") {
    return { ok: false, status: 403, error: "forbidden" };
  }
  return { ok: true, actingUserId: acting };
}
