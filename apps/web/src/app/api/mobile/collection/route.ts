import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readActorFromRequest } from "@/lib/authContext";

export const runtime = "nodejs";

/**
 * Returns the authenticated collector's owned editions with artwork metadata.
 *
 * ISO 27001 A.9.2.1 / A.9.4.2 (CLAUDE.md §4, §2)
 * KO: Bearer 토큰으로 인증된 수집가의 소장 에디션 목록을 반환한다(고해상도 자산 URL 없음).
 * JA: Bearer トークンで認証されたコレクターの所蔵エディション一覧を返す（高解像度資産 URL なし）。
 * EN: Returns the authenticated collector's owned editions; excludes high-fidelity asset URLs
 *     (those require a per-artwork lease via /api/mobile/artwork/[slug]/lease).
 */
export async function GET(req: NextRequest): Promise<Response> {
  const actor = await readActorFromRequest(req);
  if (!actor) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const editions = await prisma.edition.findMany({
    where: {
      currentOwnerUserId: actor.userId,
      isIssued: true,
    },
    include: {
      artwork: {
        select: {
          id: true,
          title: true,
          description: true,
          editionMode: true,
          storedFileRef: true,
          storedFileMime: true,
          artist: {
            select: { id: true, name: true },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const items = editions.map((ed: typeof editions[number]) => {
    // Build public thumbnail URL using the stored file ref as catalog slug (base64url encoded filename)
    const fileRef = ed.artwork.storedFileRef ?? "";
    const slug = fileRef ? Buffer.from(fileRef).toString("base64url") : "";
    const thumbUrl = slug
      ? `/api/catalog-image/${encodeURIComponent(slug)}/thumb`
      : null;

    return {
      editionId: ed.id,
      editionNumber: ed.editionNumber,
      editionTotal: ed.editionTotal,
      editionMode: ed.artwork.editionMode,
      artworkId: ed.artwork.id,
      title: ed.artwork.title,
      description: ed.artwork.description ?? null,
      artistName: ed.artwork.artist.name ?? null,
      mimeType: ed.artwork.storedFileMime ?? null,
      /** Public low-res thumbnail (no auth required) */
      thumbUrl,
      /** Slug for /api/mobile/artwork/[slug]/lease — base64url of stored file ref */
      artworkSlug: slug,
      mintedAt: ed.mintedAt?.toISOString() ?? null,
    };
  });

  return NextResponse.json(
    { ok: true, editions: items, total: items.length },
    { headers: { "X-Robots-Tag": "noindex" } },
  );
}
