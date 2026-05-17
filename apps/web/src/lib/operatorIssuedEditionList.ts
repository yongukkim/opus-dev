import { listAllSubmissions } from "@/lib/privateStorage";
import { prisma } from "@/lib/prisma";

export type OperatorIssuedEditionRow = {
  editionId: string;
  submissionId: string | null;
  /** Aligns with 작품 데이터 — submission ledger title when linked, else catalog Artwork.title. */
  artworkTitle: string;
  editionNumber: number;
  editionTotal: number;
  mintedAt: string | null;
  ownerUserId: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
};

async function submissionTitleById(): Promise<Map<string, string>> {
  const submissions = await listAllSubmissions();
  const map = new Map<string, string>();
  for (const s of submissions) {
    const title = s.artworkTitle?.trim();
    if (title) map.set(s.id, title);
  }
  return map;
}

function resolveArtworkTitle(
  catalogTitle: string,
  submissionId: string | null,
  ledgerTitles: Map<string, string>,
): string {
  if (submissionId) {
    const fromLedger = ledgerTitles.get(submissionId);
    if (fromLedger) return fromLedger;
  }
  return catalogTitle.trim() || "—";
}

export async function listOperatorIssuedEditionRows(): Promise<OperatorIssuedEditionRow[]> {
  const ledgerTitles = await submissionTitleById();
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
        select: { title: true, opusSubmissionId: true },
      },
      currentOwner: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return editions.map((e) => ({
    editionId: e.id,
    submissionId: e.artwork.opusSubmissionId,
    artworkTitle: resolveArtworkTitle(e.artwork.title, e.artwork.opusSubmissionId, ledgerTitles),
    editionNumber: e.editionNumber,
    editionTotal: e.editionTotal,
    mintedAt: e.mintedAt?.toISOString() ?? null,
    ownerUserId: e.currentOwnerUserId,
    ownerName: e.currentOwner?.name?.trim() || null,
    ownerEmail: e.currentOwner?.email?.trim() || null,
  }));
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
