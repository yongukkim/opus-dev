import { createHash } from "node:crypto";
import {
  ArtworkReviewStatus,
  AudienceCategory,
  ChronicleEventType,
  ContentRating,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SubmissionRecord } from "@/lib/privateStorage";

/**
 * ISO 27001 A.12.4.1 (§5), A.9.4.2 (§2) — optional Prisma dual-write after JSONL issuance append.
 * KO: `OPUS_PRISMA_CHRONICLE_DUAL_WRITE=1`일 때만 DB에 Artwork·Edition·ISSUED Chronicle을 멱등 반영하며, 실패해도 JSONL 확정을 덮어쓰지 않는다.
 * JA: `OPUS_PRISMA_CHRONICLE_DUAL_WRITE=1` のときのみDBへ反映し、失敗してもJSONL確定を上書きしない。
 * EN: When `OPUS_PRISMA_CHRONICLE_DUAL_WRITE=1`, idempotently mirror Artwork/Edition/ISSUED rows; failures never roll back JSONL truth.
 */

const DUAL_WRITE_FLAG = "OPUS_PRISMA_CHRONICLE_DUAL_WRITE";

function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

/**
 * Prisma `ChronicleEntry.contentHash` — base fields match schema.prisma (pipe-joined), plus `editionId`
 * so batch ISSUED genesis rows for the same artwork never collide.
 * KO: 스키마 6필드 체인에 에디션 cuid를 덧붙여 동시 발행 시 해시 충돌을 막는다.
 * JA: スキーマ6フィールドにエディションcuidを付与し、同時発行時のハッシュ衝突を防ぐ。
 * EN: Append edition cuid to the six-field chain to avoid identical genesis hashes in one issuance batch.
 */
function prismaChronicleHash(input: {
  prevHash: string;
  eventType: ChronicleEventType;
  fromUserId: string;
  toUserId: string;
  listingId: string;
  occurredAtIso: string;
  editionId: string;
}): string {
  const s = [
    input.prevHash,
    input.eventType,
    input.fromUserId,
    input.toUserId,
    input.listingId,
    input.occurredAtIso,
    input.editionId,
  ].join("|");
  return sha256Hex(s);
}

function mapContentRating(r: SubmissionRecord["contentRating"]): ContentRating {
  if (r === "mature") return ContentRating.MATURE;
  if (r === "explicit") return ContentRating.EXPLICIT;
  return ContentRating.GENERAL;
}

function mapAudience(r: SubmissionRecord["audienceCategory"]): AudienceCategory | undefined {
  if (r === "male") return AudienceCategory.MALE;
  if (r === "female") return AudienceCategory.FEMALE;
  if (r === "none") return AudienceCategory.NONE;
  return undefined;
}

function issuanceNote(written: SubmissionRecord): string {
  return `Authorized edition window: ${written.initialMint}/${written.editionTotal} (${written.editionMode})`;
}

/**
 * ISO 27001 A.14.2.1 (§1) — tag strings are untrusted; trim, cap length, strip controls, dedupe.
 * KO: 제출 태그를 DB 길이 한도 내로 정규화하고 제어문자를 제거한다.
 * JA: 提出タグをDB長制限内に正規化し制御文字を除去する。
 * EN: Normalize submission tags to DB limits and strip control characters.
 */
function normalizeArtworkTags(tags: string[] | undefined): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of tags ?? []) {
    const t = raw.trim().slice(0, 64).replace(/[\u0000-\u001F\u007F]/g, "");
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

/** ISO 27001 A.12.4.1 (§5) — operator/server log line without free-form PII payloads. */
function logDualWriteFailure(written: SubmissionRecord, err: unknown): void {
  const prismaCode =
    typeof err === "object" && err !== null && "code" in err
      ? String((err as { code: unknown }).code)
      : undefined;
  const name = err instanceof Error ? err.name : "UnknownError";
  console.error(
    "[chronicle-prisma-sync]",
    JSON.stringify({
      event: "issuance_dual_write_failed",
      opusSubmissionId: written.id,
      errorName: name,
      prismaCode: prismaCode || undefined,
    }),
  );
}

export async function syncIssuanceToPrismaAfterJsonl(
  written: SubmissionRecord,
  occurredAtIso: string,
): Promise<void> {
  if (process.env[DUAL_WRITE_FLAG]?.trim() !== "1") return;

  const artistId = written.artistId?.trim();
  if (!artistId) return;

  const user = await prisma.user.findUnique({ where: { id: artistId } }).catch(() => null);
  if (!user) return;

  /** Align with JSONL row `occurredAt` string from `appendIssuanceChronicleIfNewlyApproved`. */
  const occurredAt = new Date(occurredAtIso);
  const occurredAtIsoNorm = occurredAt.toISOString();
  const note = issuanceNote(written);
  const { getCanonicalArtistArtworkTitle } = await import("@/lib/privateStorage");
  const title = ((await getCanonicalArtistArtworkTitle(written.id)) || written.artworkTitle).trim().slice(0, 256);
  const genre = written.genre?.trim().slice(0, 64) || null;
  const description = written.description?.trim() ? written.description.trim().slice(0, 50_000) : null;

  try {
    await prisma.$transaction(async (tx) => {
      const artwork = await tx.artwork.upsert({
        where: { opusSubmissionId: written.id },
        create: {
          opusSubmissionId: written.id,
          artistUserId: artistId,
          title,
          genre,
          year: written.year,
          description,
          audienceCategory: mapAudience(written.audienceCategory),
          contentRating: mapContentRating(written.contentRating),
          editionMode: written.editionMode,
          editionTotal: written.editionTotal,
          numberingPolicy: written.numberingPolicy,
          lockEdition: written.lockEdition,
          initialPriceJpy: written.priceJpy,
          reviewStatus: ArtworkReviewStatus.APPROVED,
          reviewNote: written.reviewNote?.trim() ? written.reviewNote.trim().slice(0, 4000) : null,
          reviewedAt: occurredAt,
          reviewedByUserId: written.reviewedBy?.trim() || null,
          storedFileRef: written.storedFile.relativePath.slice(0, 512),
          storedFileMime: written.storedFile.mime.slice(0, 128),
          storedFileBytes: written.storedFile.bytes,
        },
        update: {
          opusSubmissionId: written.id,
          title,
          genre,
          year: written.year,
          description,
          audienceCategory: mapAudience(written.audienceCategory),
          contentRating: mapContentRating(written.contentRating),
          editionMode: written.editionMode,
          editionTotal: written.editionTotal,
          numberingPolicy: written.numberingPolicy,
          lockEdition: written.lockEdition,
          initialPriceJpy: written.priceJpy,
          reviewStatus: ArtworkReviewStatus.APPROVED,
          reviewNote: written.reviewNote?.trim() ? written.reviewNote.trim().slice(0, 4000) : null,
          reviewedAt: occurredAt,
          reviewedByUserId: written.reviewedBy?.trim() || null,
          storedFileRef: written.storedFile.relativePath.slice(0, 512),
          storedFileMime: written.storedFile.mime.slice(0, 128),
          storedFileBytes: written.storedFile.bytes,
        },
      });

      /**
       * ISO 27001 A.12.4.1 (§5) — discovery tags mirror JSONL submission; replace-set keeps Prisma in sync with re-approval edits.
       * KO: `artwork_tags`를 제출 태그 집합과 일치시키며 멱등으로 갱신한다.
       * JA: `artwork_tags`を提出タグ集合と一致させ冪等に更新する。
       * EN: Idempotently align `artwork_tags` with the submission tag set (replace semantics).
       */
      const tagRows = normalizeArtworkTags(written.tags);
      await tx.artworkTag.deleteMany({ where: { artworkId: artwork.id } });
      if (tagRows.length > 0) {
        await tx.artworkTag.createMany({
          data: tagRows.map((tag) => ({ artworkId: artwork.id, tag })),
          skipDuplicates: true,
        });
      }

      for (let n = 1; n <= written.editionTotal; n += 1) {
        const issued = n <= written.initialMint;
        await tx.edition.upsert({
          where: {
            artworkId_editionNumber: { artworkId: artwork.id, editionNumber: n },
          },
          create: {
            artworkId: artwork.id,
            editionNumber: n,
            editionTotal: written.editionTotal,
            isIssued: issued,
            mintedAt: issued ? occurredAt : null,
            currentOwnerUserId: issued ? artistId : null,
          },
          update: {
            editionTotal: written.editionTotal,
            isIssued: issued,
            mintedAt: issued ? occurredAt : null,
            currentOwnerUserId: issued ? artistId : null,
          },
        });
      }

      for (let n = 1; n <= written.initialMint; n += 1) {
        const edition = await tx.edition.findUnique({
          where: { artworkId_editionNumber: { artworkId: artwork.id, editionNumber: n } },
        });
        if (!edition) continue;

        const existingGenesis = await tx.chronicleEntry.findFirst({
          where: {
            editionId: edition.id,
            eventType: ChronicleEventType.ISSUED,
            prevEntryId: null,
          },
        });
        if (existingGenesis) continue;

        const contentHash = prismaChronicleHash({
          prevHash: "GENESIS",
          eventType: ChronicleEventType.ISSUED,
          fromUserId: "",
          toUserId: artistId,
          listingId: "",
          occurredAtIso: occurredAtIsoNorm,
          editionId: edition.id,
        });

        await tx.chronicleEntry.create({
          data: {
            editionId: edition.id,
            occurredAt,
            eventType: ChronicleEventType.ISSUED,
            fromUserId: null,
            toUserId: artistId,
            listingId: null,
            note,
            prevEntryId: null,
            contentHash,
          },
        });
      }
    });
  } catch (err: unknown) {
    logDualWriteFailure(written, err);
    // JSONL issuance remains authoritative; never rethrow into approval handler.
  }
}
