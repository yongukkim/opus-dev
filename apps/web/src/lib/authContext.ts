import type { NextRequest } from "next/server";
import type { Actor, OpusRole } from "./privateStorage";

const ALLOWED_ROLES: readonly OpusRole[] = ["artist", "operator", "collector"] as const;

/**
 * ISO 27001 / OPUS Security Coding Standards
 * - A.9.2.1 (§4) Least Privilege RBAC
 *   KO: API 접근은 최소 권한 원칙에 따라 역할(artist/operator/collector)과 사용자 식별자(userId)를 함께 검증합니다.
 *   JA: APIアクセスは最小権限の原則に従い、役割（artist/operator/collector）とユーザーIDを組み合わせて検証します。
 *   EN: API access follows least privilege; requests are authorized using both role and user identity.
 */
export function readActorFromRequest(request: NextRequest): Actor | null {
  // NOTE: temporary transport until real auth session is wired.
  const userId = request.headers.get("x-opus-user-id")?.trim() ?? "";
  const role = request.headers.get("x-opus-role")?.trim() ?? "";
  if (!userId || !ALLOWED_ROLES.includes(role as OpusRole)) return null;
  return { userId, role: role as OpusRole };
}

