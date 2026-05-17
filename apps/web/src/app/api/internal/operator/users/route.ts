import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { authorizeInternalOperatorRequest } from "@/lib/internalOperatorGate";
import { countArtworkRegistrationsByArtistId } from "@/lib/operatorUserArtworkCounts";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

export type OperatorUserListRow = {
  id: string;
  name: string;
  email: string;
  role: "collector" | "artist" | "operator";
  createdAt: string;
  emailVerified: boolean;
  /** Submission-ledger registration count; set only when role is artist. */
  artworkCount: number | null;
};

function mapRole(role: string): OperatorUserListRow["role"] {
  if (role === "ARTIST") return "artist";
  if (role === "OPERATOR") return "operator";
  return "collector";
}

function enrichUserRows(
  users: Array<{
    id: string;
    name: string | null;
    email: string | null;
    role: string;
    createdAt: Date;
    emailVerified: Date | null;
  }>,
  artworkByArtistId: Map<string, number>,
): OperatorUserListRow[] {
  return users.map((u) => {
    const role = mapRole(u.role);
    return {
      id: u.id,
      name: u.name ?? "",
      email: u.email ?? "",
      role,
      createdAt: u.createdAt.toISOString(),
      emailVerified: u.emailVerified != null,
      artworkCount: role === "artist" ? (artworkByArtistId.get(u.id) ?? 0) : null,
    };
  });
}

function parsePositiveInt(raw: string | null, fallback: number, max?: number): number {
  const n = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  if (max != null) return Math.min(max, n);
  return n;
}

/**
 * ISO 27001 A.9.2.1 / A.18.1.4 (CLAUDE.md §4, §7) — Operator-only PII listing for the dedicated console.
 * KO: 콘솔 전용 비밀·OPERATOR 검증 하에 회원 식별에 필요한 최소 필드만 페이지 단위로 반환한다.
 * JA: コンソール専用シークレットとOPERATOR検証のもと、会員識別に必要な最小フィールドのみをページ単位で返す。
 * EN: Under console-only secret + OPERATOR check, return the minimum member fields page by page.
 */
export async function GET(req: NextRequest): Promise<Response> {
  const gate = await authorizeInternalOperatorRequest(req);
  if (!gate.ok) {
    return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  }

  const sp = req.nextUrl.searchParams;
  const roleParam = sp.get("role")?.trim().toLowerCase();
  const roleWhere: Prisma.UserWhereInput | undefined =
    roleParam === "artist"
      ? { role: "ARTIST" }
      : roleParam === "operator"
        ? { role: "OPERATOR" }
        : roleParam === "collector"
          ? { role: "COLLECTOR" }
          : undefined;

  const q = sp.get("q")?.trim() ?? "";
  const paginate = sp.has("page") || sp.has("pageSize") || q.length > 0;
  const page = parsePositiveInt(sp.get("page"), 1);
  const pageSize = parsePositiveInt(sp.get("pageSize"), DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

  const searchWhere: Prisma.UserWhereInput | undefined = q
    ? {
        OR: [
          { email: { contains: q, mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } },
          { id: { contains: q, mode: "insensitive" } },
        ],
      }
    : undefined;

  const where: Prisma.UserWhereInput = {
    ...(roleWhere ?? {}),
    ...(searchWhere ?? {}),
  };

  const select = {
    id: true,
    name: true,
    email: true,
    role: true,
    createdAt: true,
    emailVerified: true,
  } as const;

  const artworkByArtistId = await countArtworkRegistrationsByArtistId();

  if (!paginate) {
    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select,
    });
    const rows = enrichUserRows(users, artworkByArtistId);
    return NextResponse.json({ ok: true, users: rows, total: rows.length });
  }

  const total = await prisma.user.count({ where });
  const totalPages = total === 0 ? 1 : Math.max(1, Math.ceil(total / pageSize));
  const safePage = total === 0 ? 1 : Math.min(page, totalPages);

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (safePage - 1) * pageSize,
    take: pageSize,
    select,
  });

  const rows = enrichUserRows(users, artworkByArtistId);

  return NextResponse.json({
    ok: true,
    users: rows,
    total,
    page: safePage,
    pageSize,
    totalPages,
  });
}
