import { listAllEditionCertificateRecords } from "@/lib/editionCertificate";
import { listAllSubmissions } from "@/lib/privateStorage";
import { prisma } from "@/lib/prisma";

export type OperatorIssuedEditionRow = {
  editionId: string;
  submissionId: string | null;
  /** Artist-entered title from `submissions.jsonl` only (작품 등록 폼 `artworkTitle`). */
  artworkTitle: string;
  editionNumber: number;
  editionTotal: number;
  mintedAt: string | null;
  ownerUserId: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
};

/** Latest `artworkTitle` per submission id — sole source for operator console display. */
async function artistRegisteredTitleBySubmissionId(): Promise<Map<string, string>> {
  const submissions = await listAllSubmissions();
  const map = new Map<string, string>();
  for (const s of submissions) {
    const title = s.artworkTitle?.trim();
    if (title) map.set(s.id, title);
  }
  return map;
}

function resolveSubmissionId(
  opusSubmissionId: string | null,
  artistUserId: string,
  editionNumber: number,
  certRows: { submissionId: string; editionNumber: number }[],
  submissionArtistById: Map<string, string>,
): string | null {
  if (opusSubmissionId) return opusSubmissionId;
  const matches: string[] = [];
  for (const c of certRows) {
    if (c.editionNumber !== editionNumber) continue;
    const artistId = submissionArtistById.get(c.submissionId);
    if (artistId === artistUserId) matches.push(c.submissionId);
  }
  if (matches.length === 1) return matches[0]!;
  return null;
}

export async function listOperatorIssuedEditionRows(): Promise<OperatorIssuedEditionRow[]> {
  const titleBySubmissionId = await artistRegisteredTitleBySubmissionId();
  const submissions = await listAllSubmissions();
  const submissionArtistById = new Map(submissions.map((s) => [s.id, s.artistId]));
  const certRows = (await listAllEditionCertificateRecords()).map((c) => ({
    submissionId: c.submissionId,
    editionNumber: c.editionNumber,
  }));

  const editions = await prisma.edition.findMany({
    where: { isIssued: true },
    orderBy: [{ mintedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      editionNumber: true,
      editionTotal: true,
      mintedAt: true,
      currentOwnerUserId: true,
      artwork: {
        select: { opusSubmissionId: true, artistUserId: true },
      },
      currentOwner: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return editions.map((e) => {
    const submissionId = resolveSubmissionId(
      e.artwork.opusSubmissionId,
      e.artwork.artistUserId,
      e.editionNumber,
      certRows,
      submissionArtistById,
    );
    const artworkTitle = submissionId ? (titleBySubmissionId.get(submissionId) ?? "") : "";
    return {
      editionId: e.id,
      submissionId,
      artworkTitle,
      editionNumber: e.editionNumber,
      editionTotal: e.editionTotal,
      mintedAt: e.mintedAt?.toISOString() ?? null,
      ownerUserId: e.currentOwnerUserId,
      ownerName: e.currentOwner?.name?.trim() || null,
      ownerEmail: e.currentOwner?.email?.trim() || null,
    };
  });
}

const EDITION_SORT_KEYS = new Set(["title", "edition", "minted", "owner", "editionId", "submission"]);

function compareStrings(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

export function filterOperatorIssuedEditionRows(
  rows: OperatorIssuedEditionRow[],
  q: string,
): OperatorIssuedEditionRow[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter((r) =>
    [
      r.artworkTitle,
      r.submissionId ?? "",
      r.editionId,
      r.ownerUserId ?? "",
      r.ownerName ?? "",
      r.ownerEmail ?? "",
      `${r.editionNumber}/${r.editionTotal}`,
    ].some((x) => x.toLowerCase().includes(needle)),
  );
}

export function sortOperatorIssuedEditionRows(
  rows: OperatorIssuedEditionRow[],
  sort: string | undefined,
  order: "asc" | "desc" | undefined,
): OperatorIssuedEditionRow[] {
  const out = [...rows];
  const key = sort && EDITION_SORT_KEYS.has(sort) ? sort : "minted";
  const useAsc = order === "asc";

  out.sort((a, b) => {
    let cmp = 0;
    switch (key) {
      case "title":
        cmp = compareStrings(a.artworkTitle, b.artworkTitle);
        break;
      case "edition":
        cmp = a.editionNumber - b.editionNumber;
        if (cmp === 0) cmp = a.editionTotal - b.editionTotal;
        break;
      case "owner": {
        const al = (a.ownerName ?? a.ownerEmail ?? "").toLowerCase();
        const bl = (b.ownerName ?? b.ownerEmail ?? "").toLowerCase();
        cmp = compareStrings(al, bl);
        break;
      }
      case "editionId":
        cmp = compareStrings(a.editionId, b.editionId);
        break;
      case "submission":
        cmp = compareStrings(a.submissionId ?? "", b.submissionId ?? "");
        break;
      case "minted":
      default: {
        const av = a.mintedAt ?? "";
        const bv = b.mintedAt ?? "";
        cmp = compareStrings(av, bv);
      }
    }
    if (cmp === 0) cmp = compareStrings(a.editionId, b.editionId);
    return useAsc ? cmp : -cmp;
  });
  return out;
}

export function paginateOperatorIssuedEditionRows(
  rows: OperatorIssuedEditionRow[],
  page: number,
  pageSize: number,
): { rows: OperatorIssuedEditionRow[]; total: number; page: number; pageSize: number; totalPages: number } {
  const total = rows.length;
  const totalPages = total === 0 ? 1 : Math.max(1, Math.ceil(total / pageSize));
  const safePage = total === 0 ? 1 : Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    rows: rows.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}
