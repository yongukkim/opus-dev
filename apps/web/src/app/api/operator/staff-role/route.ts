import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { appendOperatorRoleAudit } from "@/lib/operatorRoleAudit";

export const runtime = "nodejs";

type Body = { email?: string; role?: "collector" | "artist" | "operator" };

function mapToDbRole(role: Body["role"]): "COLLECTOR" | "ARTIST" | "OPERATOR" | null {
  if (role === "collector") return "COLLECTOR";
  if (role === "artist") return "ARTIST";
  if (role === "operator") return "OPERATOR";
  return null;
}

/**
 * ISO 27001 A.9.2.1 (§4) RBAC · A.14.2.1 (§1) Input validation · A.12.4.1 (§5) Audit
 * KO: 운영자만 직원용 계정 이메일로 역할을 지정할 수 있으며, 변경 내역은 감사 로그에 남깁니다.
 * JA: 運営者のみがスタッフ用メールで役割を指定でき、変更履歴は監査ログへ記録されます。
 * EN: Only operators can assign roles by staff email, and all changes are audit-logged.
 */
export async function POST(request: NextRequest): Promise<Response> {
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

  const email = body.email?.trim().toLowerCase() ?? "";
  const dbRole = mapToDbRole(body.role);
  if (!email || !dbRole) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  });
  if (!target) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  if (target.id === session.user.id && dbRole !== "OPERATOR") {
    return NextResponse.json({ ok: false, error: "self_guard" }, { status: 400 });
  }

  if (target.role !== dbRole) {
    await prisma.user.update({
      where: { id: target.id },
      data: { role: dbRole },
      select: { id: true },
    });
    await appendOperatorRoleAudit({
      operatorUserId: session.user.id,
      targetUserId: target.id,
      fromRole: target.role,
      toRole: dbRole,
    });
  }

  return NextResponse.json({ ok: true, role: dbRole }, { status: 200 });
}
