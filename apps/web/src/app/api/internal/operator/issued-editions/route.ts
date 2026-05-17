import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authorizeInternalOperatorRequest } from "@/lib/internalOperatorGate";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export type OperatorIssuedEditionRow = {
  editionId: string;
  submissionId: string | null;
  artworkTitle: string;
  editionNumber: number;
  editionTotal: number;
  mintedAt: string | null;
};

/**
 * ISO 27001 A.9.2.1 / A.13.1.3 — Issued edition rows (public certificate surfaces) for operator console.
 * KO: 콘솔 전용 비밀·OPERATOR 검증 하에 정식 발행(isIssued)된 에디션 목록만 반환한다.
 * JA: コンソール専用シークレットとOPERATOR検証のもと、正式発行（isIssued）エディション一覧のみを返す。
 * EN: Under console-only secret + OPERATOR check, return formally issued edition rows only.
 */
export async function GET(req: NextRequest): Promise<Response> {
  const gate = await authorizeInternalOperatorRequest(req);
  if (!gate.ok) {
    return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  }

  void req;

  const editions = await prisma.edition.findMany({
    where: { isIssued: true },
    orderBy: [{ mintedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      editionNumber: true,
      editionTotal: true,
      mintedAt: true,
      artwork: {
        select: { title: true, opusSubmissionId: true },
      },
    },
  });

  const rows: OperatorIssuedEditionRow[] = editions.map((e: (typeof editions)[number]) => ({
    editionId: e.id,
    submissionId: e.artwork.opusSubmissionId,
    artworkTitle: e.artwork.title,
    editionNumber: e.editionNumber,
    editionTotal: e.editionTotal,
    mintedAt: e.mintedAt?.toISOString() ?? null,
  }));

  return NextResponse.json({ ok: true, editions: rows, total: rows.length });
}
