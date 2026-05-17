import type {
  ConsoleArtworkRow,
  ConsoleIssuedEditionRow,
  ConsoleMemberRow,
  ConsoleProvenanceListingRow,
} from "@/lib/webInternal";

export function devPreviewArtistRows(): ConsoleMemberRow[] {
  return [
    {
      id: "preview-artist-1",
      name: "Sato Artist",
      email: "artist@preview.local",
      role: "artist",
      createdAt: "2025-12-10T14:30:00.000Z",
      emailVerified: true,
      artworkCount: 1,
    },
  ];
}

export function devPreviewArtworkRows(): ConsoleArtworkRow[] {
  return [
    {
      id: "preview-sub-1",
      createdAt: "2026-01-12T10:00:00.000Z",
      artworkTitle: "Moonlit Terrace",
      nickname: "Sato",
      artistId: "preview-artist-1",
      genre: "Photography",
      reviewStatus: "approved",
      editionMode: "limited",
      editionTotal: 10,
    },
  ];
}

export function devPreviewProvenanceAuctionRows(): ConsoleProvenanceListingRow[] {
  return [
    {
      id: "preview-listing-auction",
      createdAt: "2026-02-01T12:00:00.000Z",
      artworkTitle: "Collector Transfer Sample",
      artistPenName: "Sato",
      saleMode: "auction",
      priceJpy: 50000,
      editionRef: "1/10",
      sellerId: "preview-collector-1",
      sourceSubmissionId: "preview-sub-1",
      auctionEndAt: "2026-06-01T12:00:00.000Z",
    },
  ];
}

export function devPreviewProvenanceFixedRows(): ConsoleProvenanceListingRow[] {
  return [
    {
      id: "preview-listing-fixed",
      createdAt: "2026-02-15T09:00:00.000Z",
      artworkTitle: "Fixed Custody Sample",
      artistPenName: "Kim",
      saleMode: "fixed",
      priceJpy: 120000,
      editionRef: "2/10",
      sellerId: "preview-collector-2",
      sourceSubmissionId: "preview-sub-1",
      auctionEndAt: null,
    },
  ];
}

export function devPreviewIssuedEditionRows(): ConsoleIssuedEditionRow[] {
  const submissionId = "preview-sub-1";
  const base = {
    submissionId,
    artworkTitle: "Moonlit Terrace",
    linkStatus: "linked" as const,
    editionTotal: 3,
    ownerUserId: "preview-collector-1",
    ownerName: "Kim Collector",
    ownerEmail: "collector@preview.local",
  };
  return [1, 2, 3].map((n) => ({
    editionId: `preview-edition-${n}`,
    ...base,
    editionNumber: n,
    mintedAt: `2026-03-0${n}T08:00:00.000Z`,
  }));
}
