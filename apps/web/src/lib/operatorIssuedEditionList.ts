import { listAllEditionCertificateRecords } from "@/lib/editionCertificate";
import { repairEditionLedgerCatalogLinks, resolveEditionLedgerDisplay } from "@/lib/editionLedgerBinding";
import { buildArtworkTitleBySubmissionIdMap } from "@/lib/privateStorage";
import { prisma } from "@/lib/prisma";

export type OperatorIssuedEditionRow = {
  editionId: string;
  submissionId: string | null;
  /** Artist-entered title from linked submission ledger only. */
  artworkTitle: string;
  linkStatus: "linked" | "unlinked";
  editionNumber: number;
  editionTotal: number;
  /** Certificate `issuedAtIso` (authoritative issuance ledger), not Prisma `mintedAt` alone. */
  mintedAt: string | null;
  ownerUserId: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
};

export async function listOperatorIssuedEditionRows(): Promise<OperatorIssuedEditionRow[]> {
  await repairEditionLedgerCatalogLinks(false);

  const titleBySubmissionId = await buildArtworkTitleBySubmissionIdMap();
  const certs = await listAllEditionCertificateRecords();
  const certSubmissionIds = [...new Set(certs.map((c) => c.submissionId.trim()).filter(Boolean))];

  const [catalogArtworks, prismaEditions] = await Promise.all([
    certSubmissionIds.length > 0
      ? prisma.artwork.findMany({
          where: { opusSubmissionId: { in: certSubmissionIds } },
          select: { opusSubmissionId: true },
        })
      : Promise.resolve([]),
    prisma.edition.findMany({
      where: { isIssued: true },
      select: {
        id: true,
        editionNumber: true,
        currentOwnerUserId: true,
        artwork: { select: { opusSubmissionId: true } },
        currentOwner: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  const dbLinkedSubmissionIds = new Set(
    catalogArtworks.map((a) => a.opusSubmissionId?.trim()).filter(Boolean) as string[],
  );

  const prismaBySlot = new Map<string, (typeof prismaEditions)[number]>();
  for (const e of prismaEditions) {
    const sid = e.artwork.opusSubmissionId?.trim();
    if (sid) prismaBySlot.set(`${sid}|${e.editionNumber}`, e);
  }

  const custodyIds = [...new Set(certs.map((c) => c.custodyUserId.trim()).filter(Boolean))];
  const custodyUsers =
    custodyIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: custodyIds } },
          select: { id: true, name: true, email: true },
        })
      : [];
  const userById = new Map(custodyUsers.map((u: (typeof custodyUsers)[number]) => [u.id, u]));

  return certs.map((cert) => {
    const submissionId = cert.submissionId.trim();
    const pe = prismaBySlot.get(`${submissionId}|${cert.editionNumber}`);
    const linkStatus: "linked" | "unlinked" = dbLinkedSubmissionIds.has(submissionId)
      ? "linked"
      : "unlinked";
    const ledger = resolveEditionLedgerDisplay(submissionId, titleBySubmissionId);
    const artworkTitle = ledger.artworkTitle || cert.artworkTitle.trim();

    const ownerFromPrisma = pe?.currentOwner;
    const ownerFromCert = userById.get(cert.custodyUserId.trim());
    const custodyUserId = cert.custodyUserId.trim();
    const ownerUserId = pe?.currentOwnerUserId ?? (custodyUserId || null);
    const ownerName =
      ownerFromPrisma?.name?.trim() || ownerFromCert?.name?.trim() || null;
    const ownerEmail =
      ownerFromPrisma?.email?.trim() || ownerFromCert?.email?.trim() || null;

    return {
      editionId: pe?.id ?? `cert:${cert.bindingKey}`,
      submissionId,
      artworkTitle,
      linkStatus,
      editionNumber: cert.editionNumber,
      editionTotal: cert.editionTotal,
      mintedAt: cert.issuedAtIso,
      ownerUserId,
      ownerName,
      ownerEmail,
    };
  });
}

const EDITION_SORT_KEYS = new Set([
  "title",
  "edition",
  "minted",
  "owner",
  "editionId",
  "submission",
  "link",
]);

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
      r.linkStatus,
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
      case "link":
        cmp = compareStrings(a.linkStatus, b.linkStatus);
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

/** One artwork registration (`submissionId`) with every issued edition certificate. */
export type OperatorIssuedEditionGroup = {
  submissionId: string | null;
  artworkTitle: string;
  linkStatus: "linked" | "unlinked";
  editionTotal: number;
  issuedCount: number;
  latestMintedAt: string | null;
  editions: OperatorIssuedEditionRow[];
};

export function groupOperatorIssuedEditionRows(rows: OperatorIssuedEditionRow[]): OperatorIssuedEditionGroup[] {
  const byKey = new Map<string, OperatorIssuedEditionRow[]>();
  for (const row of rows) {
    const key = row.submissionId?.trim() || `__edition:${row.editionId}`;
    const list = byKey.get(key) ?? [];
    list.push(row);
    byKey.set(key, list);
  }

  const groups: OperatorIssuedEditionGroup[] = [];
  for (const [, editions] of byKey) {
    editions.sort((a, b) => a.editionNumber - b.editionNumber);
    const head = editions[0]!;
    let latestMintedAt: string | null = null;
    for (const e of editions) {
      const m = e.mintedAt?.trim();
      if (!m) continue;
      if (!latestMintedAt || m > latestMintedAt) latestMintedAt = m;
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

export function filterOperatorIssuedEditionGroups(
  groups: OperatorIssuedEditionGroup[],
  q: string,
): OperatorIssuedEditionGroup[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return groups;
  return groups.filter((g) => {
    if (
      [
        g.artworkTitle,
        g.submissionId ?? "",
        g.linkStatus,
        `${g.issuedCount}/${g.editionTotal}`,
      ].some((x) => x.toLowerCase().includes(needle))
    ) {
      return true;
    }
    return g.editions.some((e) =>
      [
        e.editionId,
        e.ownerUserId ?? "",
        e.ownerName ?? "",
        e.ownerEmail ?? "",
        `${e.editionNumber}/${e.editionTotal}`,
      ].some((x) => x.toLowerCase().includes(needle)),
    );
  });
}

export function sortOperatorIssuedEditionGroups(
  groups: OperatorIssuedEditionGroup[],
  sort: string | undefined,
  order: "asc" | "desc" | undefined,
): OperatorIssuedEditionGroup[] {
  const out = [...groups];
  const key = sort && EDITION_SORT_KEYS.has(sort) ? sort : "minted";
  const useAsc = order === "asc";

  out.sort((a, b) => {
    let cmp = 0;
    switch (key) {
      case "title":
        cmp = compareStrings(a.artworkTitle, b.artworkTitle);
        break;
      case "edition":
        cmp = a.issuedCount - b.issuedCount;
        if (cmp === 0) cmp = a.editionTotal - b.editionTotal;
        break;
      case "owner": {
        const al = (a.editions[0]?.ownerName ?? a.editions[0]?.ownerEmail ?? "").toLowerCase();
        const bl = (b.editions[0]?.ownerName ?? b.editions[0]?.ownerEmail ?? "").toLowerCase();
        cmp = compareStrings(al, bl);
        break;
      }
      case "submission":
        cmp = compareStrings(a.submissionId ?? "", b.submissionId ?? "");
        break;
      case "link":
        cmp = compareStrings(a.linkStatus, b.linkStatus);
        break;
      case "editionId":
        cmp = compareStrings(a.editions[0]?.editionId ?? "", b.editions[0]?.editionId ?? "");
        break;
      case "minted":
      default:
        cmp = compareStrings(a.latestMintedAt ?? "", b.latestMintedAt ?? "");
    }
    if (cmp === 0) cmp = compareStrings(a.submissionId ?? "", b.submissionId ?? "");
    return useAsc ? cmp : -cmp;
  });
  return out;
}

export function paginateOperatorIssuedEditionGroups(
  groups: OperatorIssuedEditionGroup[],
  page: number,
  pageSize: number,
): {
  groups: OperatorIssuedEditionGroup[];
  total: number;
  certificateTotal: number;
  page: number;
  pageSize: number;
  totalPages: number;
} {
  const total = groups.length;
  const certificateTotal = groups.reduce((n, g) => n + g.issuedCount, 0);
  const totalPages = total === 0 ? 1 : Math.max(1, Math.ceil(total / pageSize));
  const safePage = total === 0 ? 1 : Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    groups: groups.slice(start, start + pageSize),
    total,
    certificateTotal,
    page: safePage,
    pageSize,
    totalPages,
  };
}
