import type {
  ConsoleArtworkRow,
  ConsoleIssuedEditionGroup,
  ConsoleIssuedEditionRow,
  ConsoleMemberRow,
} from "@/lib/webInternal";
import type { ConsoleListSortOrder } from "@/lib/consoleListQuery";

const ROLE_RANK: Record<ConsoleMemberRow["role"], number> = {
  artist: 1,
  collector: 0,
  operator: 2,
};

const REVIEW_RANK: Record<ConsoleArtworkRow["reviewStatus"], number> = {
  pending_review: 0,
  changes_requested: 1,
  approved: 2,
  rejected: 3,
  withdrawn: 4,
};

function compareStrings(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

function applyDir(cmp: number, order: ConsoleListSortOrder): number {
  return order === "asc" ? cmp : -cmp;
}

export function sortMemberRows(
  rows: ConsoleMemberRow[],
  sort: string | undefined,
  order: ConsoleListSortOrder | undefined,
): ConsoleMemberRow[] {
  if (!sort || !order) {
    return [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  const out = [...rows];
  out.sort((a, b) => {
    let cmp = 0;
    switch (sort) {
      case "name":
        cmp = compareStrings(a.name, b.name);
        break;
      case "email":
        cmp = compareStrings(a.email, b.email);
        break;
      case "role":
        cmp = ROLE_RANK[a.role] - ROLE_RANK[b.role];
        break;
      case "artworkCount": {
        const av = a.artworkCount ?? -1;
        const bv = b.artworkCount ?? -1;
        cmp = av - bv;
        break;
      }
      case "created":
        cmp = compareStrings(a.createdAt, b.createdAt);
        break;
      case "verified":
        cmp = Number(a.emailVerified) - Number(b.emailVerified);
        break;
      case "id":
        cmp = compareStrings(a.id, b.id);
        break;
      default:
        cmp = compareStrings(a.createdAt, b.createdAt);
    }
    return applyDir(cmp, order);
  });
  return out;
}

export function sortArtworkRows(
  rows: ConsoleArtworkRow[],
  sort: string | undefined,
  order: ConsoleListSortOrder | undefined,
): ConsoleArtworkRow[] {
  if (!sort || !order) {
    return [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  const out = [...rows];
  out.sort((a, b) => {
    let cmp = 0;
    switch (sort) {
      case "title":
        cmp = compareStrings(a.artworkTitle, b.artworkTitle);
        break;
      case "penName":
        cmp = compareStrings(a.nickname, b.nickname);
        break;
      case "genre":
        cmp = compareStrings(a.genre, b.genre);
        break;
      case "status":
        cmp = REVIEW_RANK[a.reviewStatus] - REVIEW_RANK[b.reviewStatus];
        break;
      case "edition":
        cmp = a.editionTotal - b.editionTotal;
        break;
      case "created":
        cmp = compareStrings(a.createdAt, b.createdAt);
        break;
      case "id":
        cmp = compareStrings(a.id, b.id);
        break;
      default:
        cmp = compareStrings(a.createdAt, b.createdAt);
    }
    return applyDir(cmp, order);
  });
  return out;
}

export function groupCertificateRows(rows: ConsoleIssuedEditionRow[]): ConsoleIssuedEditionGroup[] {
  const byKey = new Map<string, ConsoleIssuedEditionRow[]>();
  for (const row of rows) {
    const key = row.submissionId?.trim() || `__edition:${row.editionId}`;
    const list = byKey.get(key) ?? [];
    list.push(row);
    byKey.set(key, list);
  }
  const groups: ConsoleIssuedEditionGroup[] = [];
  for (const [, editions] of byKey) {
    editions.sort((a, b) => a.editionNumber - b.editionNumber);
    const head = editions[0]!;
    let latestMintedAt: string | null = null;
    for (const e of editions) {
      const m = e.mintedAt?.trim();
      if (m && (!latestMintedAt || m > latestMintedAt)) latestMintedAt = m;
    }
    groups.push({
      submissionId: head.submissionId,
      artworkTitle: head.artworkTitle,
      linkStatus: head.linkStatus,
      editionTotal: head.editionTotal,
      issuedCount: editions.length,
      latestMintedAt,
      editions,
    });
  }
  return groups;
}

export function sortCertificateGroups(
  groups: ConsoleIssuedEditionGroup[],
  sort: string | undefined,
  order: ConsoleListSortOrder | undefined,
): ConsoleIssuedEditionGroup[] {
  if (!sort || !order) {
    return [...groups].sort((a, b) => (b.latestMintedAt ?? "").localeCompare(a.latestMintedAt ?? ""));
  }
  const out = [...groups];
  out.sort((a, b) => {
    let cmp = 0;
    switch (sort) {
      case "title":
        cmp = compareStrings(a.artworkTitle, b.artworkTitle);
        break;
      case "edition":
        cmp = a.issuedCount - b.issuedCount;
        if (cmp === 0) cmp = a.editionTotal - b.editionTotal;
        break;
      case "minted":
        cmp = compareStrings(a.latestMintedAt ?? "", b.latestMintedAt ?? "");
        break;
      case "owner": {
        const al = a.editions[0]?.ownerName ?? a.editions[0]?.ownerEmail ?? "";
        const bl = b.editions[0]?.ownerName ?? b.editions[0]?.ownerEmail ?? "";
        cmp = compareStrings(al, bl);
        break;
      }
      case "editionId":
        cmp = compareStrings(a.editions[0]?.editionId ?? "", b.editions[0]?.editionId ?? "");
        break;
      case "submission":
        cmp = compareStrings(a.submissionId ?? "", b.submissionId ?? "");
        break;
      case "link":
        cmp = compareStrings(a.linkStatus, b.linkStatus);
        break;
      default:
        cmp = compareStrings(a.latestMintedAt ?? "", b.latestMintedAt ?? "");
    }
    return applyDir(cmp, order);
  });
  return out;
}
