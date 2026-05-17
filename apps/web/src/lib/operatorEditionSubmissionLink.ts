import { listAllEditionCertificateRecords } from "@/lib/editionCertificate";
import {
  buildArtworkTitleBySubmissionIdMap,
  listAllSubmissions,
  type SubmissionRecord,
} from "@/lib/privateStorage";

export type OperatorEditionLinkContext = {
  editionNumber: number;
  editionTotal: number;
  artistUserId: string;
  opusSubmissionId: string | null;
  /** Prisma catalog title — inference only; display title stays on JSONL `artworkTitle`. */
  catalogTitle: string;
};

export type SubmissionLinkIndexes = {
  titleBySubmissionId: Map<string, string>;
  submissionById: Map<string, SubmissionRecord>;
  byArtistEditionSlot: Map<string, string[]>;
  byArtistEditionTotal: Map<string, string[]>;
  byArtistTitle: Map<string, string[]>;
  byCertBinding: Map<string, string>;
};

function normTitle(s: string): string {
  return s.trim().toLowerCase();
}

function slotKey(artistUserId: string, editionNumber: number, editionTotal: number): string {
  return `${artistUserId}|${editionNumber}|${editionTotal}`;
}

function pushIndex(map: Map<string, string[]>, key: string, submissionId: string): void {
  const cur = map.get(key) ?? [];
  if (!cur.includes(submissionId)) cur.push(submissionId);
  map.set(key, cur);
}

function uniqueCandidate(ids: string[] | undefined): string | null {
  if (!ids || ids.length !== 1) return null;
  return ids[0]!;
}

export async function buildSubmissionLinkIndexes(): Promise<SubmissionLinkIndexes> {
  const submissions = await listAllSubmissions();
  const submissionById = new Map(submissions.map((s) => [s.id, s]));
  const titleBySubmissionId = await buildArtworkTitleBySubmissionIdMap();
  const byArtistEditionSlot = new Map<string, string[]>();
  const byArtistEditionTotal = new Map<string, string[]>();
  const byArtistTitle = new Map<string, string[]>();

  for (const s of submissions) {
    const title = titleBySubmissionId.get(s.id) ?? "";
    if ((s.reviewStatus ?? "pending_review") !== "approved") continue;
    pushIndex(byArtistEditionTotal, `${s.artistId}|${s.editionTotal}`, s.id);
    if (title) pushIndex(byArtistTitle, `${s.artistId}|${normTitle(title)}`, s.id);
  }

  const byCertBinding = new Map<string, string>();
  const certs = await listAllEditionCertificateRecords();
  for (const c of certs) {
    byCertBinding.set(c.bindingKey, c.submissionId);
    const sub = submissionById.get(c.submissionId);
    if (!sub) continue;
    pushIndex(byArtistEditionSlot, slotKey(sub.artistId, c.editionNumber, sub.editionTotal), c.submissionId);
  }

  return {
    titleBySubmissionId,
    submissionById,
    byArtistEditionSlot,
    byArtistEditionTotal,
    byArtistTitle,
    byCertBinding,
  };
}

/** Resolve JSONL submission id for a issued Prisma edition (display title still from JSONL only). */
export function inferSubmissionIdForEdition(
  ctx: OperatorEditionLinkContext,
  indexes: SubmissionLinkIndexes,
): string | null {
  if (ctx.opusSubmissionId?.trim()) return ctx.opusSubmissionId.trim();

  const fromSlot = uniqueCandidate(
    indexes.byArtistEditionSlot.get(slotKey(ctx.artistUserId, ctx.editionNumber, ctx.editionTotal)),
  );
  if (fromSlot) return fromSlot;

  const bindingCandidates: string[] = [];
  for (const [key, submissionId] of indexes.byCertBinding) {
    if (!key.endsWith(`#e${ctx.editionNumber}`)) continue;
    const sub = indexes.submissionById.get(submissionId);
    if (!sub || sub.artistId !== ctx.artistUserId || sub.editionTotal !== ctx.editionTotal) continue;
    if (!bindingCandidates.includes(submissionId)) bindingCandidates.push(submissionId);
  }
  const fromBinding = uniqueCandidate(bindingCandidates);
  if (fromBinding) return fromBinding;

  const aetPool = indexes.byArtistEditionTotal.get(`${ctx.artistUserId}|${ctx.editionTotal}`) ?? [];
  const mintOk = aetPool.filter((id) => {
    const sub = indexes.submissionById.get(id);
    return sub != null && ctx.editionNumber <= sub.initialMint;
  });
  const fromMint = uniqueCandidate(mintOk);
  if (fromMint) return fromMint;

  const catalogNorm = normTitle(ctx.catalogTitle);
  if (catalogNorm) {
    const fromTitle = uniqueCandidate(
      indexes.byArtistTitle.get(`${ctx.artistUserId}|${catalogNorm}`),
    );
    if (fromTitle) return fromTitle;
  }

  return null;
}

export function artistRegisteredTitle(
  submissionId: string | null,
  indexes: Pick<SubmissionLinkIndexes, "titleBySubmissionId">,
  /** Prisma `Artwork.title` from artist registration at approval (not filename/catalog). */
  registrationTitleFallback?: string,
): string {
  if (!submissionId) return "";
  const fromLedger = indexes.titleBySubmissionId.get(submissionId)?.trim();
  if (fromLedger) return fromLedger;
  return registrationTitleFallback?.trim() ?? "";
}

export type ArtworkBackfillCandidate = {
  artworkId: string;
  inferredSubmissionId: string;
};

export async function listArtworkOpusSubmissionBackfillCandidates(): Promise<{
  candidates: ArtworkBackfillCandidate[];
  ambiguousArtworkIds: string[];
  stillUnlinkedArtworkIds: string[];
}> {
  const indexes = await buildSubmissionLinkIndexes();
  const { prisma } = await import("@/lib/prisma");
  const artworks = await prisma.artwork.findMany({
    where: { opusSubmissionId: null },
    select: {
      id: true,
      artistUserId: true,
      title: true,
      editionTotal: true,
      editions: { where: { isIssued: true }, select: { editionNumber: true }, orderBy: { editionNumber: "asc" } },
    },
  });

  const candidates: ArtworkBackfillCandidate[] = [];
  const ambiguousArtworkIds: string[] = [];
  const stillUnlinkedArtworkIds: string[] = [];

  for (const a of artworks) {
    const probeEdition = a.editions[0]?.editionNumber ?? 1;
    const inferred = inferSubmissionIdForEdition(
      {
        editionNumber: probeEdition,
        editionTotal: a.editionTotal,
        artistUserId: a.artistUserId,
        opusSubmissionId: null,
        catalogTitle: a.title,
      },
      indexes,
    );

    if (!inferred) {
      stillUnlinkedArtworkIds.push(a.id);
      continue;
    }

    const sub = indexes.submissionById.get(inferred);
    if (!sub || sub.artistId !== a.artistUserId) {
      stillUnlinkedArtworkIds.push(a.id);
      continue;
    }

    const probeNumbers = a.editions.map((e) => e.editionNumber);
    const probes = probeNumbers.length > 0 ? probeNumbers : [probeEdition];
    const consistent = probes.every(
      (editionNumber) =>
        inferSubmissionIdForEdition(
          {
            editionNumber,
            editionTotal: a.editionTotal,
            artistUserId: a.artistUserId,
            opusSubmissionId: null,
            catalogTitle: a.title,
          },
          indexes,
        ) === inferred,
    );
    if (!consistent) {
      ambiguousArtworkIds.push(a.id);
      continue;
    }

    candidates.push({ artworkId: a.id, inferredSubmissionId: inferred });
  }

  return { candidates, ambiguousArtworkIds, stillUnlinkedArtworkIds };
}

export async function applyArtworkOpusSubmissionBackfill(dryRun: boolean): Promise<{
  dryRun: boolean;
  linked: number;
  skippedAmbiguous: number;
  skippedUnresolved: number;
  candidates: ArtworkBackfillCandidate[];
}> {
  const { candidates, ambiguousArtworkIds, stillUnlinkedArtworkIds } =
    await listArtworkOpusSubmissionBackfillCandidates();

  if (!dryRun && candidates.length > 0) {
    const { prisma } = await import("@/lib/prisma");
    for (const c of candidates) {
      await prisma.artwork.update({
        where: { id: c.artworkId },
        data: { opusSubmissionId: c.inferredSubmissionId },
      });
    }
  }

  return {
    dryRun,
    linked: candidates.length,
    skippedAmbiguous: ambiguousArtworkIds.length,
    skippedUnresolved: stillUnlinkedArtworkIds.length,
    candidates,
  };
}
