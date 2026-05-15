export type ReviewRow = {
  id: string;
  createdAt: string;
  artistId: string;
  nickname: string;
  artworkTitle: string;
  mime?: string;
  audienceCategory?: "male" | "female" | "none";
  priceJpy?: number;
  reviewStatus: "pending_review" | "approved" | "changes_requested" | "rejected" | "withdrawn";
  contentRating: "general" | "mature" | "explicit";
  reviewNote?: string;
  editionMode: "unique" | "limited";
  editionTotal: number;
  initialMint: number;
  numberingPolicy: "auto" | "manual";
  lockEdition: boolean;
};

function asStatus(v: unknown): ReviewRow["reviewStatus"] {
  if (
    v === "pending_review" ||
    v === "approved" ||
    v === "changes_requested" ||
    v === "rejected" ||
    v === "withdrawn"
  )
    return v;
  return "pending_review";
}

function asRating(v: unknown): ReviewRow["contentRating"] {
  if (v === "general" || v === "mature" || v === "explicit") return v;
  return "general";
}

function asEditionMode(v: unknown): "unique" | "limited" {
  return v === "limited" ? "limited" : "unique";
}

function asNum(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

/** Normalize API JSON into review table rows (internal API returns storefront submission records). */
export function normalizeSubmissionRecord(raw: unknown): ReviewRow | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = typeof r.id === "string" ? r.id : null;
  if (!id) return null;
  const stored = r.storedFile;
  let mime: string | undefined;
  if (stored && typeof stored === "object" && typeof (stored as { mime?: string }).mime === "string") {
    mime = (stored as { mime: string }).mime;
  }
  return {
    id,
    createdAt: typeof r.createdAt === "string" ? r.createdAt : "",
    artistId: typeof r.artistId === "string" ? r.artistId : "",
    nickname: typeof r.nickname === "string" ? r.nickname : "",
    artworkTitle: typeof r.artworkTitle === "string" ? r.artworkTitle : "",
    mime,
    audienceCategory:
      r.audienceCategory === "male" || r.audienceCategory === "female" || r.audienceCategory === "none"
        ? r.audienceCategory
        : undefined,
    priceJpy: typeof r.priceJpy === "number" ? r.priceJpy : undefined,
    reviewStatus: asStatus(r.reviewStatus),
    contentRating: asRating(r.contentRating),
    reviewNote: typeof r.reviewNote === "string" ? r.reviewNote : undefined,
    editionMode: asEditionMode(r.editionMode),
    editionTotal: asNum(r.editionTotal, 1),
    initialMint: asNum(r.initialMint, 1),
    numberingPolicy: r.numberingPolicy === "manual" ? "manual" : "auto",
    lockEdition: Boolean(r.lockEdition),
  };
}

export function normalizeSubmissionList(rows: unknown[]): ReviewRow[] {
  return rows.map(normalizeSubmissionRecord).filter((x): x is ReviewRow => x !== null);
}

/** Matches `ConsoleReviewWorkspace` actionable queue (operator must act). */
export function countActionableSubmissions(rows: ReviewRow[]): number {
  return rows.filter((r) => r.reviewStatus === "pending_review" || r.reviewStatus === "changes_requested").length;
}
