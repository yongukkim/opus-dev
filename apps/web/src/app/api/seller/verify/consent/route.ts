import { NextRequest, NextResponse } from "next/server";
import { getRequestClientIp } from "@/lib/requestClientIp";
import { appendSellerVerifyConsentRecord } from "@/lib/sellerVerifyConsentAudit";

export const runtime = "nodejs";

/**
 * ISO 27001 A.14.2.1 (§1) Input validation · A.12.4.1 (§5) Audit · A.18.1.4 (§7) APPI
 * KO: 동의 플래그는 서버에서 true만 허용하고, agreedAt은 서버 시각으로만 기록한다.
 * JA: 同意フラグはサーバでtrueのみ許可し、agreedAtはサーバ時刻のみで記録する。
 * EN: Consent flags must be true on server; agreedAt is always server-generated.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const o = body as Record<string, unknown>;
  const consentCollection = o["consentCollection"] === true;
  const consentSensitiveId = o["consentSensitiveId"] === true;
  const consentThirdParty = o["consentThirdParty"] === true;

  if (!consentCollection || !consentSensitiveId || !consentThirdParty) {
    return NextResponse.json({ ok: false, error: "consent_incomplete" }, { status: 400 });
  }

  const ipAddress = getRequestClientIp(request);

  try {
    const record = await appendSellerVerifyConsentRecord({
      ipAddress,
      consentCollection,
      consentSensitiveId,
      consentThirdParty,
    });

    return NextResponse.json(
      {
        ok: true,
        id: record.id,
        agreedAt: record.agreedAt,
        ipAddress: record.ipAddress,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ ok: false, error: "persist_failed" }, { status: 500 });
  }
}
