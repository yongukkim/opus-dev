import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { processDueMintJobs } from "@/lib/onchainMintQueue";

export const runtime = "nodejs";

/**
 * ISO 27001 A.9.2.1 (§4), A.13.1.3 (§6), A.12.4.1 (§5)
 * KO: 민팅 처리 API는 운영자만 호출할 수 있고, 처리 개수 상한을 검증하며, 결과 통계를 남겨 운영 재시도를 가능하게 합니다.
 * JA: ミント処理APIは運営者のみ実行可能で、件数上限を検証し、結果統計を残して運用再試行を可能にします。
 * EN: Mint processing is operator-only, validates batch limits, and returns auditable processing stats for retries.
 */
export async function POST(request: NextRequest): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "operator") {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const limitRaw = request.nextUrl.searchParams.get("limit")?.trim() ?? "";
  const parsed = Number.parseInt(limitRaw || "3", 10);
  const limit = Number.isFinite(parsed) ? Math.min(20, Math.max(1, parsed)) : 3;

  const stats = await processDueMintJobs(limit);
  return NextResponse.json({ ok: true, limit, ...stats }, { status: 200 });
}
