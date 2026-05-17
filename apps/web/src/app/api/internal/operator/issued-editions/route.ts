import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authorizeInternalOperatorRequest } from "@/lib/internalOperatorGate";
import {
  groupOperatorIssuedEditionRows,
  filterOperatorIssuedEditionGroups,
  listOperatorIssuedEditionRows,
  paginateOperatorIssuedEditionGroups,
  sortOperatorIssuedEditionGroups,
  type OperatorIssuedEditionGroup,
} from "@/lib/operatorIssuedEditionList";

export const runtime = "nodejs";

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

function parsePositiveInt(raw: string | null, fallback: number, max?: number): number {
  const n = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  if (max != null) return Math.min(max, n);
  return n;
}

/**
 * ISO 27001 A.9.2.1 / A.13.1.3 — Paginated issued edition rows for the operator console.
 * KO: 콘솔 전용 비밀·OPERATOR 검증 하에 제출 ID(작품)별로 묶은 발행 인증서 목록을 페이지 단위로 반환한다.
 * JA: コンソール専用シークレットとOPERATOR検証のもと、提出ID（作品）単位にまとめた発行認証書一覧を返す。
 * EN: Under console-only secret + OPERATOR check, return paginated certificate groups keyed by submission id (artwork).
 */
export async function GET(req: NextRequest): Promise<Response> {
  const gate = await authorizeInternalOperatorRequest(req);
  if (!gate.ok) {
    return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  }

  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim() ?? "";
  const page = parsePositiveInt(sp.get("page"), 1);
  const pageSize = parsePositiveInt(sp.get("pageSize"), DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  const sort = sp.get("sort")?.trim() || undefined;
  const orderRaw = sp.get("order")?.trim().toLowerCase();
  const order = orderRaw === "asc" || orderRaw === "desc" ? orderRaw : sort ? "asc" : undefined;

  const all = await listOperatorIssuedEditionRows();
  const grouped = groupOperatorIssuedEditionRows(all);
  const filtered = filterOperatorIssuedEditionGroups(grouped, q);
  const sorted = sortOperatorIssuedEditionGroups(filtered, sort, order);
  const paged = paginateOperatorIssuedEditionGroups(sorted, page, pageSize);

  const body: {
    ok: true;
    groups: OperatorIssuedEditionGroup[];
    total: number;
    certificateTotal: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } = {
    ok: true,
    groups: paged.groups,
    total: paged.total,
    certificateTotal: paged.certificateTotal,
    page: paged.page,
    pageSize: paged.pageSize,
    totalPages: paged.totalPages,
  };

  return NextResponse.json(body);
}
