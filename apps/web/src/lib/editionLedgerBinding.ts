import { editionBindingKey, listAllEditionCertificateRecords } from "@/lib/editionCertificate";
import { buildArtworkTitleBySubmissionIdMap, getSubmissionById } from "@/lib/privateStorage";

/**
 * Edition ↔ submission ledger binding (fail-closed).
 * KO: 제출 ID는 `Artwork.opusSubmissionId`로만 연결하며 추측하지 않습니다. 작품명은 해당 제출 원장 최초 등록 제목만 표시합니다.
 * JA: 提出IDは `Artwork.opusSubmissionId` のみで結び、推測しません。作品名は当該提出原簿の初回登録タイトルのみ表示します。
 * EN: Bind editions only via `Artwork.opusSubmissionId` (no guessing). Display the first artist registration title from that ledger.
 */

export type EditionLedgerLinkStatus = "linked" | "unlinked";

export type EditionLedgerDisplay = {
  submissionId: string | null;
  artworkTitle: string;
  linkStatus: EditionLedgerLinkStatus;
};

export function resolveEditionLedgerDisplay(
  opusSubmissionId: string | null | undefined,
  titleBySubmissionId: Map<string, string>,
): EditionLedgerDisplay {
  const submissionId = opusSubmissionId?.trim() || null;
  if (!submissionId) {
    return { submissionId: null, artworkTitle: "", linkStatus: "unlinked" };
  }
  return {
    submissionId,
    artworkTitle: titleBySubmissionId.get(submissionId)?.trim() ?? "",
    linkStatus: "linked",
  };
}

/**
 * Cert-proven link only: every issued edition number must have a certificate row for the same submission.
 * KO: 인증서 JSONL이 에디션 슬롯 전체를 증명할 때만 `opusSubmissionId` 백필 후보로 인정합니다.
 * JA: 認証書JSONLが全発行エディションスロットを証明するときのみ `opusSubmissionId` バックフィル候補とします。
 * EN: Backfill candidates only when certificate JSONL proves every issued edition slot for one submission id.
 */
export async function findCertProvenSubmissionIdForArtwork(input: {
  artistUserId: string;
  editionTotal: number;
  issuedEditionNumbers: number[];
}): Promise<string | null> {
  const artistUserId = input.artistUserId.trim();
  if (!artistUserId || input.issuedEditionNumbers.length === 0) return null;

  const issued = [...new Set(input.issuedEditionNumbers)].sort((a, b) => a - b);
  const certs = await listAllEditionCertificateRecords();
  const candidateIds = new Set<string>();

  for (const n of issued) {
    for (const c of certs) {
      if (c.editionNumber !== n || c.editionTotal !== input.editionTotal) continue;
      const sub = await getSubmissionById(c.submissionId);
      if (!sub || sub.artistId !== artistUserId || sub.editionTotal !== input.editionTotal) continue;
      candidateIds.add(c.submissionId);
    }
  }

  const proven: string[] = [];
  for (const submissionId of candidateIds) {
    const allSlotsProven = issued.every((n) => {
      const key = editionBindingKey(submissionId, n);
      return certs.some((c) => c.bindingKey === key && c.submissionId === submissionId);
    });
    if (allSlotsProven) proven.push(submissionId);
  }

  if (proven.length !== 1) return null;
  return proven[0]!;
}

export type ArtworkOpusSubmissionBackfillCandidate = {
  artworkId: string;
  submissionId: string;
};

export async function listArtworkOpusSubmissionBackfillCandidates(): Promise<{
  candidates: ArtworkOpusSubmissionBackfillCandidate[];
  ambiguousArtworkIds: string[];
  stillUnlinkedArtworkIds: string[];
}> {
  const { prisma } = await import("@/lib/prisma");
  const artworks = await prisma.artwork.findMany({
    where: { opusSubmissionId: null },
    select: {
      id: true,
      artistUserId: true,
      editionTotal: true,
      editions: {
        where: { isIssued: true },
        select: { editionNumber: true },
        orderBy: { editionNumber: "asc" },
      },
    },
  });

  const candidates: ArtworkOpusSubmissionBackfillCandidate[] = [];
  const ambiguousArtworkIds: string[] = [];
  const stillUnlinkedArtworkIds: string[] = [];

  for (const a of artworks) {
    const issuedEditionNumbers = a.editions.map((e) => e.editionNumber);
    if (issuedEditionNumbers.length === 0) {
      stillUnlinkedArtworkIds.push(a.id);
      continue;
    }

    const proven = await findCertProvenSubmissionIdForArtwork({
      artistUserId: a.artistUserId,
      editionTotal: a.editionTotal,
      issuedEditionNumbers,
    });

    if (!proven) {
      const slotCandidates = new Set<string>();
      const certs = await listAllEditionCertificateRecords();
      for (const n of issuedEditionNumbers) {
        for (const c of certs) {
          if (c.editionNumber !== n || c.editionTotal !== a.editionTotal) continue;
          slotCandidates.add(c.submissionId);
        }
      }
      if (slotCandidates.size > 1) ambiguousArtworkIds.push(a.id);
      else stillUnlinkedArtworkIds.push(a.id);
      continue;
    }

    candidates.push({ artworkId: a.id, submissionId: proven });
  }

  return { candidates, ambiguousArtworkIds, stillUnlinkedArtworkIds };
}

export async function applyArtworkOpusSubmissionBackfill(dryRun: boolean): Promise<{
  dryRun: boolean;
  linked: number;
  skippedAmbiguous: number;
  skippedUnresolved: number;
  candidates: ArtworkOpusSubmissionBackfillCandidate[];
}> {
  const { candidates, ambiguousArtworkIds, stillUnlinkedArtworkIds } =
    await listArtworkOpusSubmissionBackfillCandidates();

  if (!dryRun && candidates.length > 0) {
    const { prisma } = await import("@/lib/prisma");
    for (const c of candidates) {
      await prisma.artwork.update({
        where: { id: c.artworkId },
        data: { opusSubmissionId: c.submissionId },
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

export type EditionLedgerAuditRow = {
  editionId: string;
  artworkId: string;
  editionNumber: number;
  editionTotal: number;
  opusSubmissionId: string | null;
  linkStatus: EditionLedgerLinkStatus;
  artworkTitle: string;
};

export async function auditIssuedEditionLedgerBindings(): Promise<{
  rows: EditionLedgerAuditRow[];
  summary: { issued: number; linked: number; unlinked: number };
}> {
  const { prisma } = await import("@/lib/prisma");
  const titleBySubmissionId = await buildArtworkTitleBySubmissionIdMap();
  const editions = await prisma.edition.findMany({
    where: { isIssued: true },
    orderBy: [{ mintedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      editionNumber: true,
      editionTotal: true,
      artwork: { select: { id: true, opusSubmissionId: true } },
    },
  });

  const rows: EditionLedgerAuditRow[] = editions.map((e) => {
    const display = resolveEditionLedgerDisplay(e.artwork.opusSubmissionId, titleBySubmissionId);
    return {
      editionId: e.id,
      artworkId: e.artwork.id,
      editionNumber: e.editionNumber,
      editionTotal: e.editionTotal,
      opusSubmissionId: display.submissionId,
      linkStatus: display.linkStatus,
      artworkTitle: display.artworkTitle,
    };
  });

  const linked = rows.filter((r) => r.linkStatus === "linked").length;
  return {
    rows,
    summary: { issued: rows.length, linked, unlinked: rows.length - linked },
  };
}

/** @deprecated Use resolveEditionLedgerDisplay — never infer submission ids. */
export function artistRegisteredTitle(
  submissionId: string | null,
  titleBySubmissionId: Map<string, string>,
): string {
  if (!submissionId) return "";
  return titleBySubmissionId.get(submissionId)?.trim() ?? "";
}
