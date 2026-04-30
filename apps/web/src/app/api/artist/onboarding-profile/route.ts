import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  getArtistPayoutProfile,
  saveArtistPayoutProfile,
} from "@/lib/artistPayoutProfile";

export const runtime = "nodejs";

const MAX_DISPLAY_NAME = 80;
const MAX_BANK_NAME = 120;
const MAX_ACCOUNT_HOLDER = 120;
const MAX_ACCOUNT_NUMBER = 32;

function normalizeDisplayName(input: unknown): string {
  if (typeof input !== "string") return "";
  return input.trim().slice(0, MAX_DISPLAY_NAME);
}

function normalizeBankName(input: unknown): string {
  if (typeof input !== "string") return "";
  return input.trim().slice(0, MAX_BANK_NAME);
}

function normalizeAccountHolder(input: unknown): string {
  if (typeof input !== "string") return "";
  return input.trim().slice(0, MAX_ACCOUNT_HOLDER);
}

function normalizeAccountNumber(input: unknown): string {
  if (typeof input !== "string") return "";
  return input.replace(/\D/g, "").slice(0, MAX_ACCOUNT_NUMBER);
}

/**
 * ISO 27001 A.9.2.1 (§4), A.14.2.1 (§1), A.18.1.4 (§7)
 * KO: 작가 본인 세션에서만 온보딩(필명·정산계좌)을 저장하고, 입력 길이/형식을 검증해 오입력과 과다 수집을 방지합니다.
 * JA: 作家本人セッションのみがオンボーディング（筆名・精算口座）を保存でき、入力の型/長さを検証して過剰収集を防ぎます。
 * EN: Only the signed-in artist may save onboarding (pen name + payout account); strict input checks prevent malformed or excessive data.
 */
export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "artist" || !session.user.id) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  const payout = await getArtistPayoutProfile(session.user.id);
  return NextResponse.json({
    ok: true,
    profile: {
      displayName: session.user.name ?? "",
      bankName: payout?.bankName ?? "",
      accountHolder: payout?.accountHolder ?? "",
      accountNumber: payout?.accountNumber ?? "",
    },
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "artist" || !session.user.id) {
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
  const displayName = normalizeDisplayName(payload["displayName"]);
  const bankName = normalizeBankName(payload["bankName"]);
  const accountHolder = normalizeAccountHolder(payload["accountHolder"]);
  const accountNumber = normalizeAccountNumber(payload["accountNumber"]);

  if (!displayName || !bankName || !accountHolder || accountNumber.length < 6) {
    return NextResponse.json({ ok: false, error: "invalid_fields" }, { status: 400 });
  }

  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true },
    });
    const existingPenName = currentUser?.name?.trim() ?? "";

    let finalDisplayName = existingPenName;
    if (existingPenName) {
      if (displayName !== existingPenName) {
        return NextResponse.json({ ok: false, error: "pen_name_locked" }, { status: 409 });
      }
    } else {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { name: displayName },
      });
      finalDisplayName = displayName;
    }

    const payout = await saveArtistPayoutProfile({
      artistId: session.user.id,
      bankName,
      accountHolder,
      accountNumber,
    });

    return NextResponse.json({
      ok: true,
      profile: {
        displayName: finalDisplayName,
        bankName: payout.bankName,
        accountHolder: payout.accountHolder,
        accountNumber: payout.accountNumber,
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
  }
}
