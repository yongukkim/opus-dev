import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authorizeInternalOperatorRequest } from "@/lib/internalOperatorGate";
import {
  filterOperatorIssuedEditionRows,
  listOperatorIssuedEditionRows,
  paginateOperatorIssuedEditionRows,
  sortOperatorIssuedEditionRows,
  type OperatorIssuedEditionRow,
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
 * KO: 콘솔 전용 비밀·OPERATOR 검증 하에 정식 발행(isIssued) 에디션 목록을 페이지 단위로 반환한다.
 * JA: コンソール専用シークレットとOPERATOR検証のもと、正式発行（isIssued）エディション一覧をページ単位で返す。
 * EN: Under console-only secret + OPERATOR check, return paginated formally issued edition rows.
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
  const filtered = filterOperatorIssuedEditionRows(all, q);
  const sorted = sortOperatorIssuedEditionRows(filtered, sort, order);
  const paged = paginateOperatorIssuedEditionRows(sorted, page, pageSize);

  const body: {
    ok: true;
    editions: OperatorIssuedEditionRow[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } = {
    ok: true,
    editions: paged.rows,
    total: paged.total,
    page: paged.page,
    pageSize: paged.pageSize,
    totalPages: paged.totalPages,
  };

  return NextResponse.json(body);
}
