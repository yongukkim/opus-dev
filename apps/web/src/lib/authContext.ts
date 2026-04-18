import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import type { Actor, OpusRole } from "./privateStorage";

const ALLOWED_ROLES: readonly OpusRole[] = ["artist", "operator", "collector"] as const;

/**
 * ISO 27001 A.9.2.1 (§4) Least Privilege RBAC
 * KO: 프로덕션에서는 Auth.js 세션의 사용자 ID·역할만 신뢰한다(개발 환경에서만 헤더 폴백).
 * JA: 本番ではAuth.jsセッションのユーザーID・役割のみを信頼する（開発時のみヘッダフォールバック）。
 * EN: Trust only Auth.js session identity/role in production; header fallback exists for local dev only.
 */
export async function readActorFromRequest(request: NextRequest): Promise<Actor | null> {
  const session = await auth();
  if (session?.user?.id) {
    const role = session.user.role;
    if (ALLOWED_ROLES.includes(role as OpusRole)) {
      return { userId: session.user.id, role: role as OpusRole };
    }
  }

  if (process.env.NODE_ENV !== "production") {
    const userId = request.headers.get("x-opus-user-id")?.trim() ?? "";
    const role = request.headers.get("x-opus-role")?.trim() ?? "";
    if (!userId || !ALLOWED_ROLES.includes(role as OpusRole)) return null;
    return { userId, role: role as OpusRole };
  }

  return null;
}
