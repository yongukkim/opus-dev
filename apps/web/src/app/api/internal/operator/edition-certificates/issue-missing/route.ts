import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { issueMissingEditionCertificates } from "@/lib/editionCertificate";
import { authorizeInternalOperatorRequest } from "@/lib/internalOperatorGate";

export const runtime = "nodejs";

/**
 * ISO 27001 A.9.2.1 (§4) / A.12.4.1 (§5)
 * KO: OPERATOR 전용 — 승인됐으나 인증서 JSONL이 비어 있는 제출에 서명 인증서를 idempotent 발행합니다.
 * JA: OPERATOR 専用 — 承認済みだが認証書 JSONL が欠けている提出へ冪等に署名認証書を発行します。
 * EN: OPERATOR-only: idempotently issue signed certificate JSONL rows for approved submissions that lack them.
 *
 * Query: `dryRun=1` — list targets only.
 * Body (optional): `{ "submissionIds": ["…"] }` — limit repair set.
 */
export async function POST(req: NextRequest): Promise<Response> {
  const gate = await authorizeInternalOperatorRequest(req);
  if (!gate.ok) {
    return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  }

  const dryRun = req.nextUrl.searchParams.get("dryRun") === "1";
  let submissionIds: string[] | undefined;
  try {
    const body = (await req.json()) as unknown;
    if (body !== null && typeof body === "object" && "submissionIds" in body) {
      const raw = (body as { submissionIds?: unknown }).submissionIds;
      if (Array.isArray(raw)) {
        submissionIds = raw.filter((x): x is string => typeof x === "string");
      }
    }
  } catch {
    /* empty body is fine */
  }

  const result = await issueMissingEditionCertificates({ dryRun, submissionIds });
  return NextResponse.json({ ok: true, ...result });
}
