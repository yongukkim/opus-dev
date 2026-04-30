import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserPaymentMethod, saveUserPaymentMethod } from "@/lib/userPaymentMethod";

export const runtime = "nodejs";

/**
 * ISO 27001 A.9.2.1 (§4), A.14.2.1 (§1), A.18.1.4 (§7), A.10.1.1 (§3)
 * KO: 전체 카드번호·CVV는 저장하지 않고, 본인 세션에서만 표시용 메타(명의·브랜드·끝4자리·만료)를 검증 후 append-only로 기록합니다.
 * JA: カード番号全体・CVVは保存せず、本人セッションのみが表示用メタを検証して追記のみ記録します。
 * EN: Never store full PAN/CVV; only session owner may persist display metadata (holder, brand, last4, expiry) append-only.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  const row = await getUserPaymentMethod(session.user.id);
  return NextResponse.json({
    ok: true,
    method: row
      ? {
          cardholderName: row.cardholderName,
          brand: row.brand,
          last4: row.last4,
          expMonth: row.expMonth,
          expYear: row.expYear,
        }
      : null,
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const cardholderName = payload["cardholderName"];
  const brand = payload["brand"];
  const last4 = payload["last4"];
  const expMonthRaw = payload["expMonth"];
  const expYearRaw = payload["expYear"];

  const expMonth = typeof expMonthRaw === "number" ? expMonthRaw : Number.parseInt(String(expMonthRaw ?? ""), 10);
  const expYear = typeof expYearRaw === "number" ? expYearRaw : Number.parseInt(String(expYearRaw ?? ""), 10);

  try {
    const row = await saveUserPaymentMethod({
      userId: session.user.id,
      cardholderName: typeof cardholderName === "string" ? cardholderName : "",
      brand: typeof brand === "string" ? brand : "",
      last4: typeof last4 === "string" ? last4 : "",
      expMonth,
      expYear,
    });
    return NextResponse.json({
      ok: true,
      method: {
        cardholderName: row.cardholderName,
        brand: row.brand,
        last4: row.last4,
        expMonth: row.expMonth,
        expYear: row.expYear,
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_fields" }, { status: 400 });
  }
}
