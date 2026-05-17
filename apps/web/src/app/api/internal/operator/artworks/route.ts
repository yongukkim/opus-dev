import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authorizeInternalOperatorRequest } from "@/lib/internalOperatorGate";
import {
  filterOperatorArtworkRows,
  listOperatorArtworkRows,
  paginateOperatorArtworkRows,
  type OperatorArtworkListRow,
} from "@/lib/operatorArtworkList";

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
 * ISO 27001 A.9.2.1 / A.13.1.3 — Paginated artwork registrations for the operator console.
 * KO: 콘솔 전용 비밀·OPERATOR 검증 하에 제출 원장 기준 작품 등록 목록을 페이지 단위로 반환한다.
 * JA: コンソール専用シークレットとOPERATOR検証のもと、提出原簿ベースの作品登録一覧をページ単位で返す。
 * EN: Under console-only secret + OPERATOR check, return paginated artwork registrations from the submissions ledger.
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

  const all = await listOperatorArtworkRows();
  const filtered = filterOperatorArtworkRows(all, q);
  const paged = paginateOperatorArtworkRows(filtered, page, pageSize);

  const body: {
    ok: true;
    artworks: OperatorArtworkListRow[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } = {
    ok: true,
    artworks: paged.rows,
    total: paged.total,
    page: paged.page,
    pageSize: paged.pageSize,
    totalPages: paged.totalPages,
  };

  return NextResponse.json(body);
}
