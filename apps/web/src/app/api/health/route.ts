import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * ISO 27001 / OPUS Security Coding Standards
 * - A.12.4.1 (§5) Secure logging & auditing — errors are abstracted for clients, details only to server logs.
 *   KO: 헬스체크는 DB 연결 상태만 반환하고, 상세 에러는 서버 로그로만 남긴다(PII·스택 비노출).
 *   JA: ヘルスチェックはDB接続状態のみを返し、詳細エラーはサーバーログにのみ残す（PII・スタック非公開）。
 *   EN: Health check returns only the DB connectivity status; details stay in server logs, never in client responses.
 * - A.13.1.3 (§6) API security — unauthenticated probe returns minimal metadata (no internal IPs, no stack traces).
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  try {
    const rows = await prisma.$queryRaw<Array<{ one: number }>>`SELECT 1 AS one`;
    const ok = Array.isArray(rows) && rows[0]?.one === 1;
    return NextResponse.json({ ok, db: ok ? "up" : "down" });
  } catch (error) {
    console.error("[health] db check failed", error);
    return NextResponse.json({ ok: false, db: "down" }, { status: 503 });
  }
}
