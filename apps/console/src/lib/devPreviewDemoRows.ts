import type { ReviewRow } from "@/lib/submissionRow";

/** Fictional rows for layout preview only (no backend, no asset URLs). */
export function devPreviewDemoRows(): ReviewRow[] {
  const now = new Date().toISOString();
  return [
    {
      id: "preview-demo-001",
      createdAt: now,
      artistId: "artist_preview_1",
      nickname: "Demo Artist",
      artworkTitle: "Sample work (pending)",
      mime: undefined,
      audienceCategory: "none",
      priceJpy: 12000,
      reviewStatus: "pending_review",
      contentRating: "general",
      editionMode: "limited",
      editionTotal: 10,
      initialMint: 1,
      numberingPolicy: "auto",
      lockEdition: false,
    },
    {
      id: "preview-demo-002",
      createdAt: now,
      artistId: "artist_preview_2",
      nickname: "Another Creator",
      artworkTitle: "Sample work (changes requested)",
      mime: undefined,
      audienceCategory: undefined,
      priceJpy: undefined,
      reviewStatus: "changes_requested",
      contentRating: "mature",
      reviewNote: "Please update title metadata.",
      editionMode: "unique",
      editionTotal: 1,
      initialMint: 1,
      numberingPolicy: "auto",
      lockEdition: true,
    },
  ];
}
