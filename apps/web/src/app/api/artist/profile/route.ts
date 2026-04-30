import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  getArtistPublicProfile,
  saveArtistPublicProfile,
} from "@/lib/artistPublicProfile";

export const runtime = "nodejs";

const MAX_DISPLAY_NAME = 80;
const MAX_BIO_LEN = 600;

function normalizeDisplayName(input: unknown): string {
  if (typeof input !== "string") return "";
  return input.trim().slice(0, MAX_DISPLAY_NAME);
}

function normalizeBio(input: unknown): string {
  if (typeof input !== "string") return "";
  return input.trim().slice(0, MAX_BIO_LEN);
}

function normalizeUseSsoImage(input: unknown): boolean {
  return input === true;
}

/**
 * ISO 27001 A.9.2.1 (§4), A.14.2.1 (§1), A.18.1.4 (§7)
 * KO: 작가 본인 세션에서만 프로필 공개 설정을 읽고 쓰며, 입력 길이와 타입을 검증해 과다 수집을 막습니다.
 * JA: 作家本人セッションのみが公開プロフィール設定を読み書きでき、入力の型と長さを検証して過剰収集を防ぎます。
 * EN: Only the signed-in artist may read/write profile visibility settings; input types and lengths are validated.
 */
export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "artist" || !session.user.id) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  const profile = await getArtistPublicProfile(session.user.id);
  return NextResponse.json({
    ok: true,
    profile: {
      displayName: session.user.name ?? "",
      bio: profile?.bio ?? "",
      useSsoImage: profile?.useSsoImage ?? false,
      ssoImageUrl: session.user.image ?? "",
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
  const bio = normalizeBio(payload["bio"]);
  const useSsoImage = normalizeUseSsoImage(payload["useSsoImage"]);

  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true },
    });
    const existingPenName = currentUser?.name?.trim() ?? "";

    let finalDisplayName = existingPenName;
    if (existingPenName) {
      if (displayName && displayName !== existingPenName) {
        return NextResponse.json({ ok: false, error: "pen_name_locked" }, { status: 409 });
      }
    } else {
      if (!displayName) {
        return NextResponse.json({ ok: false, error: "display_name_required" }, { status: 400 });
      }
      await prisma.user.update({
        where: { id: session.user.id },
        data: { name: displayName },
      });
      finalDisplayName = displayName;
    }

    const profile = await saveArtistPublicProfile({
      artistId: session.user.id,
      bio,
      useSsoImage,
    });
    return NextResponse.json({
      ok: true,
      profile: {
        displayName: finalDisplayName,
        bio: profile.bio,
        useSsoImage: profile.useSsoImage,
        ssoImageUrl: session.user.image ?? "",
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
  }
}
