import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authorizeInternalOperatorRequest } from "@/lib/internalOperatorGate";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export type OperatorUserListRow = {
  id: string;
  name: string;
  email: string;
  role: "collector" | "artist" | "operator";
  createdAt: string;
  emailVerified: boolean;
};

function mapRole(role: string): OperatorUserListRow["role"] {
  if (role === "ARTIST") return "artist";
  if (role === "OPERATOR") return "operator";
  return "collector";
}

/**
 * ISO 27001 A.9.2.1 / A.18.1.4 (CLAUDE.md §4, §7) — Operator-only PII listing for the dedicated console.
 * KO: 콘솔 전용 비밀·OPERATOR 검증 하에 회원 식별에 필요한 최소 필드(이메일·이름·역할·가입일)만 반환한다.
 * JA: コンソール専用シークレットとOPERATOR検証のもと、会員識別に必要な最小フィールドのみを返す。
 * EN: Under console-only secret + OPERATOR check, return the minimum fields needed to identify members (email, name, role, joined date).
 */
export async function GET(req: NextRequest): Promise<Response> {
  const gate = await authorizeInternalOperatorRequest(req);
  if (!gate.ok) {
    return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  }

  const roleParam = req.nextUrl.searchParams.get("role")?.trim().toLowerCase();
  const roleWhere =
    roleParam === "artist"
      ? { role: "ARTIST" as const }
      : roleParam === "operator"
        ? { role: "OPERATOR" as const }
        : roleParam === "collector"
          ? { role: "COLLECTOR" as const }
          : undefined;

  const users = await prisma.user.findMany({
    where: roleWhere,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      emailVerified: true,
    },
  });

  const rows: OperatorUserListRow[] = users.map((u: (typeof users)[number]) => ({
    id: u.id,
    name: u.name ?? "",
    email: u.email ?? "",
    role: mapRole(u.role),
    createdAt: u.createdAt.toISOString(),
    emailVerified: u.emailVerified != null,
  }));

  return NextResponse.json({ ok: true, users: rows, total: rows.length });
}
