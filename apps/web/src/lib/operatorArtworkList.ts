import { listAllSubmissions, type SubmissionRecord } from "@/lib/privateStorage";

export type OperatorArtworkListRow = {
  id: string;
  createdAt: string;
  artworkTitle: string;
  nickname: string;
  artistId: string;
  genre: string;
  reviewStatus: "pending_review" | "approved" | "changes_requested" | "rejected" | "withdrawn";
  editionMode: "unique" | "limited";
  editionTotal: number;
};

function asReviewStatus(v: unknown): OperatorArtworkListRow["reviewStatus"] {
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

export function mapSubmissionToArtworkRow(rec: SubmissionRecord): OperatorArtworkListRow {
  return {
    id: rec.id,
    createdAt: rec.createdAt,
    artworkTitle: rec.artworkTitle,
    nickname: rec.nickname,
    artistId: rec.artistId,
    genre: rec.genre,
    reviewStatus: asReviewStatus(rec.reviewStatus),
    editionMode: rec.editionMode === "limited" ? "limited" : "unique",
    editionTotal: Number.isFinite(rec.editionTotal) ? rec.editionTotal : 1,
  };
}

export async function listOperatorArtworkRows(): Promise<OperatorArtworkListRow[]> {
  const submissions = await listAllSubmissions();
  return submissions.map(mapSubmissionToArtworkRow);
}

export function filterOperatorArtworkRows(rows: OperatorArtworkListRow[], q: string): OperatorArtworkListRow[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter((r) =>
    [r.id, r.artworkTitle, r.nickname, r.genre, r.artistId, r.reviewStatus].some((x) =>
      x.toLowerCase().includes(needle),
    ),
  );
}

export function paginateOperatorArtworkRows(
  rows: OperatorArtworkListRow[],
  page: number,
  pageSize: number,
): { rows: OperatorArtworkListRow[]; total: number; page: number; pageSize: number; totalPages: number } {
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
