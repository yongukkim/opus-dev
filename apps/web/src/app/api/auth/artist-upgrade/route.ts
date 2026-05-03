import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { OPUS_TERMS_VERSION, OPUS_PRIVACY_VERSION } from "@/lib/legalVersions";

/**
 * ISO 27001 A.9.2.1 / A.18.1.4 (CLAUDE.md §4, §7)
 * KO: 로그인된 COLLECTOR가 약관 동의 후 ARTIST로 승격하는 API. 세션 검증 필수.
 * JA: ログイン済みCOLLECTORが規約同意後にARTISTへ昇格するAPI。セッション検証必須。
 * EN: Upgrades a logged-in COLLECTOR to ARTIST after consent. Session verification required.
 */
export async function POST(req: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  if (session.user.role !== "collector") {
    return NextResponse.json({ error: "already_upgraded" }, { status: 400 });
  }

  let marketing = false;
  try {
    const body = (await req.json()) as { marketing?: boolean };
    marketing = body.marketing === true;
  } catch { /* ignore */ }

  const now = new Date();
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      role: "ARTIST",
      tosAcceptedAt: now,
      tosVersionAccepted: OPUS_TERMS_VERSION,
      privacyAcceptedAt: now,
      privacyVersionAccepted: OPUS_PRIVACY_VERSION,
      overseasTransferAcceptedAt: now,
      buyerAgeSelfAttestedAt: now,
      ...(marketing ? { marketingOptInAt: now } : {}),
    },
  });

  return NextResponse.json({ ok: true });
}
