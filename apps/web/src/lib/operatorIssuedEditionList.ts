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
