import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listRecentMintJobs } from "@/lib/onchainMintQueue";

export const runtime = "nodejs";

/**
 * ISO 27001 A.9.2.1 (§4), A.13.1.3 (§6)
 * KO: 민팅 큐 조회는 운영자에게만 허용되며, 내부 작업 메타를 최소 범위로 반환합니다.
 * JA: ミントキュー参照は運営者のみに許可し、内部ジョブメタは最小限のみ返却します。
 * EN: Mint queue inspection is operator-only and returns only minimal internal job metadata.
 */
export async function GET(request: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "operator") {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const n = Number.parseInt(url.searchParams.get("limit")?.trim() || "20", 10);
  const limit = Number.isFinite(n) ? Math.min(100, Math.max(1, n)) : 20;
  const jobs = await listRecentMintJobs(limit);
  return NextResponse.json({ ok: true, jobs }, { status: 200 });
}
