import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import type { Actor, OpusRole } from "./privateStorage";
import { verifyMobileAccessToken } from "./mobileAuthToken";

const ALLOWED_ROLES: readonly OpusRole[] = ["artist", "operator", "collector"] as const;

/**
 * ISO 27001 A.9.2.1 (§4) Least Privilege RBAC
 * KO: 프로덕션에서는 Auth.js 세션 또는 모바일 Bearer 토큰의 사용자 ID·역할만 신뢰한다.
 * JA: 本番ではAuth.jsセッションまたはモバイル Bearer トークンのユーザーID・役割のみを信頼する。
 * EN: Trust Auth.js session or mobile Bearer token identity/role in production; header fallback for local dev only.
 */
export async function readActorFromRequest(request: NextRequest): Promise<Actor | null> {
  // 1. Auth.js cookie session (web)
  const session = await auth();
  if (session?.user?.id) {
    const role = session.user.role;
    if (ALLOWED_ROLES.includes(role as OpusRole)) {
      return { userId: session.user.id, role: role as OpusRole };
    }
  }

  // 2. Mobile Bearer token (native apps)
  const authHeader = request.headers.get("authorization")?.trim();
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    const payload = verifyMobileAccessToken(token);
    if (payload && ALLOWED_ROLES.includes(payload.role as OpusRole)) {
      return { userId: payload.sub, role: payload.role as OpusRole };
    }
  }

  // 3. Dev-only header fallback
  if (process.env.NODE_ENV !== "production") {
    const userId = request.headers.get("x-opus-user-id")?.trim() ?? "";
    const role = request.headers.get("x-opus-role")?.trim() ?? "";
    if (!userId || !ALLOWED_ROLES.includes(role as OpusRole)) return null;
    return { userId, role: role as OpusRole };
  }

  return null;
}
