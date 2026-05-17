import type { ConsoleArtworkRow } from "@/lib/webInternal";

function asReviewStatus(v: unknown): ConsoleArtworkRow["reviewStatus"] {
  if (
    v === "pending_review" ||
    v === "approved" ||
    v === "changes_requested" ||
    v === "rejected" ||
    v === "withdrawn"
  ) {
    return v;
  }
  return "pending_review";
}

/** Map internal submission records to console artwork list rows. */
export function mapSubmissionsToArtworkRows(rawList: unknown[]): ConsoleArtworkRow[] {
  const rows: ConsoleArtworkRow[] = [];
  for (const raw of rawList) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const id = typeof r.id === "string" ? r.id : null;
    if (!id) continue;
    rows.push({
      id,
      createdAt: typeof r.createdAt === "string" ? r.createdAt : "",
      artworkTitle: typeof r.artworkTitle === "string" ? r.artworkTitle : "",
      nickname: typeof r.nickname === "string" ? r.nickname : "",
      artistId: typeof r.artistId === "string" ? r.artistId : "",
      genre: typeof r.genre === "string" ? r.genre : "",
      reviewStatus: asReviewStatus(r.reviewStatus),
      editionMode: r.editionMode === "limited" ? "limited" : "unique",
      editionTotal: typeof r.editionTotal === "number" && Number.isFinite(r.editionTotal) ? r.editionTotal : 1,
    });
  }
  return rows;
}
