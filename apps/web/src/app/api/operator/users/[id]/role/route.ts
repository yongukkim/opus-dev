import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { appendOperatorRoleAudit } from "@/lib/operatorRoleAudit";

export const runtime = "nodejs";

type Body = { role?: "collector" | "artist" | "operator" };

function mapToDbRole(role: Body["role"]): "COLLECTOR" | "ARTIST" | "OPERATOR" | null {
  if (role === "collector") return "COLLECTOR";
  if (role === "artist") return "ARTIST";
  if (role === "operator") return "OPERATOR";
  return null;
}

/**
 * ISO 27001 A.9.2.1 (§4) Least Privilege RBAC · A.14.2.1 (§1) Input validation · A.12.4.1 (§5) Audit
 * KO: 역할 변경 API는 운영자 세션만 허용하고, 허용된 역할 값만 처리하며, 모든 변경을 감사 로그로 기록합니다.
 * JA: 役割変更APIは運営者セッションのみ許可し、許可値のみ受理し、全変更を監査ログへ記録します。
 * EN: Role updates are operator-only, allowlist-validated, and every change is audited.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "operator") {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  const dbRole = mapToDbRole(body.role);
  if (!dbRole) {
    return NextResponse.json({ ok: false, error: "invalid_role" }, { status: 400 });
  }

  const { id: targetUserId } = await context.params;
  if (!targetUserId.trim()) {
    return NextResponse.json({ ok: false, error: "invalid_target" }, { status: 400 });
  }
  if (targetUserId === session.user.id && dbRole !== "OPERATOR") {
    return NextResponse.json({ ok: false, error: "self_guard" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, role: true },
  });
  if (!target) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  if (target.role !== dbRole) {
    await prisma.user.update({
      where: { id: targetUserId },
      data: { role: dbRole },
      select: { id: true },
    });
    await appendOperatorRoleAudit({
      operatorUserId: session.user.id,
      targetUserId,
      fromRole: target.role,
      toRole: dbRole,
    });
  }

  return NextResponse.json({ ok: true, role: dbRole }, { status: 200 });
}
