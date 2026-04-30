import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getArtistPayoutProfile, saveArtistPayoutProfile } from "@/lib/artistPayoutProfile";

export const runtime = "nodejs";

/**
 * ISO 27001 A.9.2.1 (§4), A.14.2.1 (§1), A.18.1.4 (§7)
 * KO: 작가·소장자 등 로그인 본인만 정산 계좌 메타를 읽고 갱신하며, 길이·형식을 검증해 과다 수집과 오입력을 줄입니다.
 * JA: 作家・所蔵者などログイン本人のみが精算口座メタを読み書きし、長さ・形式を検証して過剰収集と誤入力を抑えます。
 * EN: Only the signed-in user (artist or collector) may read/update payout bank metadata; validate lengths and formats.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  const row = await getArtistPayoutProfile(session.user.id);
  return NextResponse.json({
    ok: true,
    bank: {
      bankName: row?.bankName ?? "",
      accountHolder: row?.accountHolder ?? "",
      accountNumber: row?.accountNumber ?? "",
    },
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
  const bankName = typeof payload["bankName"] === "string" ? payload["bankName"].trim() : "";
  const accountHolder = typeof payload["accountHolder"] === "string" ? payload["accountHolder"].trim() : "";
  const accountNumber =
    typeof payload["accountNumber"] === "string" ? payload["accountNumber"].replace(/\D/g, "") : "";

  if (!bankName || bankName.length > 120 || !accountHolder || accountHolder.length > 120) {
    return NextResponse.json({ ok: false, error: "invalid_fields" }, { status: 400 });
  }
  if (accountNumber.length < 6 || accountNumber.length > 32) {
    return NextResponse.json({ ok: false, error: "invalid_account_number" }, { status: 400 });
  }

  try {
    const row = await saveArtistPayoutProfile({
      artistId: session.user.id,
      bankName,
      accountHolder,
      accountNumber,
    });
    return NextResponse.json({
      ok: true,
      bank: {
        bankName: row.bankName,
        accountHolder: row.accountHolder,
        accountNumber: row.accountNumber,
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
  }
}
