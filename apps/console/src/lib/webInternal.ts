export function requireWebOrigin(): string {
  const u = process.env["OPUS_WEB_ORIGIN"]?.trim();
  if (!u) {
    throw new Error("OPUS_WEB_ORIGIN is required (e.g. https://app.opus-store.com)");
  }
  return u.replace(/\/$/, "");
}

export function internalOperatorHeaders(actingUserId: string): HeadersInit {
  const secret = process.env["OPUS_INTERNAL_API_SECRET"]?.trim();
  if (!secret) {
    throw new Error("OPUS_INTERNAL_API_SECRET is required");
  }
  return {
    Authorization: `Bearer ${secret}`,
    "X-Opus-Acting-User-Id": actingUserId,
  };
}

export async function fetchSubmissionsForOperator(actingUserId: string): Promise<unknown[]> {
  const origin = requireWebOrigin();
  const res = await fetch(`${origin}/api/internal/operator/submissions`, {
    headers: internalOperatorHeaders(actingUserId),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`submissions_list_failed:${res.status}`);
  }
  return res.json() as Promise<unknown[]>;
}

export type ConsoleDashboardStats = {
  membersTotal: number;
  artistsTotal: number;
  artworksTotal: number;
  provenanceAuctionsTotal: number;
  provenanceFixedPriceTotal: number;
  certificatesIssuedTotal: number;
};

export type ConsoleMemberRow = {
  id: string;
  name: string;
  email: string;
  role: "collector" | "artist" | "operator";
  createdAt: string;
  emailVerified: boolean;
  artworkCount: number | null;
};

export type ConsoleUserRoleFilter = "artist" | "collector" | "operator";

export type FetchUsersForOperatorOptions = {
  role?: ConsoleUserRoleFilter;
  page?: number;
  pageSize?: number;
  q?: string;
  sort?: string;
  order?: "asc" | "desc";
  /** When true, omit page params and load the full list (legacy / low-volume role filters). */
  all?: boolean;
};

export type FetchUsersForOperatorResult = {
  users: ConsoleMemberRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function fetchUsersForOperator(
  actingUserId: string,
  options: FetchUsersForOperatorOptions = {},
): Promise<FetchUsersForOperatorResult> {
  const origin = requireWebOrigin();
  const sp = new URLSearchParams();
  if (options.role) sp.set("role", options.role);
  if (!options.all) {
    sp.set("page", String(options.page ?? 1));
    sp.set("pageSize", String(options.pageSize ?? 25));
    if (options.q?.trim()) sp.set("q", options.q.trim());
    if (options.sort?.trim()) sp.set("sort", options.sort.trim());
    if (options.order) sp.set("order", options.order);
  }
  const qs = sp.toString();
  const res = await fetch(`${origin}/api/internal/operator/users${qs ? `?${qs}` : ""}`, {
    headers: internalOperatorHeaders(actingUserId),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`users_list_failed:${res.status}`);
  }
  const body = (await res.json()) as {
    ok?: boolean;
    users?: ConsoleMemberRow[];
    total?: number;
    page?: number;
    pageSize?: number;
    totalPages?: number;
    error?: string;
  };
  if (!body?.ok || !Array.isArray(body.users)) {
    throw new Error(`users_list_invalid:${body?.error ?? "unknown"}`);
  }
  const total = body.total ?? body.users.length;
  const pageSize = body.pageSize ?? body.users.length;
  return {
    users: body.users,
    total,
    page: body.page ?? 1,
    pageSize,
    totalPages: body.totalPages ?? Math.max(1, Math.ceil(total / Math.max(1, pageSize))),
  };
}

export async function fetchMembersForOperator(
  actingUserId: string,
  options: Omit<FetchUsersForOperatorOptions, "role" | "all"> = {},
): Promise<FetchUsersForOperatorResult> {
  return fetchUsersForOperator(actingUserId, options);
}

export type ConsoleArtworkRow = {
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

export type ConsoleProvenanceListingRow = {
  id: string;
  createdAt: string;
  artworkTitle: string;
  artistPenName: string;
  saleMode: "auction" | "fixed";
  priceJpy: number;
  editionRef: string;
  sellerId: string;
  sourceSubmissionId: string | null;
  auctionEndAt: string | null;
};

export type ConsoleIssuedEditionRow = {
  editionId: string;
  submissionId: string | null;
  /** Artist registration title from linked submission ledger only. */
  artworkTitle: string;
  /** `linked` = `Artwork.opusSubmissionId` set; `unlinked` = no cross-ledger display. */
  linkStatus: "linked" | "unlinked";
  editionNumber: number;
  editionTotal: number;
  mintedAt: string | null;
  ownerUserId: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
};

export type FetchArtworksForOperatorResult = {
  artworks: ConsoleArtworkRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function fetchArtworksForOperator(
  actingUserId: string,
  options: { page?: number; pageSize?: number; q?: string; sort?: string; order?: "asc" | "desc" } = {},
): Promise<FetchArtworksForOperatorResult> {
  const origin = requireWebOrigin();
  const sp = new URLSearchParams();
  sp.set("page", String(options.page ?? 1));
  sp.set("pageSize", String(options.pageSize ?? 25));
  if (options.q?.trim()) sp.set("q", options.q.trim());
  if (options.sort?.trim()) sp.set("sort", options.sort.trim());
  if (options.order) sp.set("order", options.order);
  const res = await fetch(`${origin}/api/internal/operator/artworks?${sp.toString()}`, {
    headers: internalOperatorHeaders(actingUserId),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`artworks_list_failed:${res.status}`);
  }
  const body = (await res.json()) as {
    ok?: boolean;
    artworks?: ConsoleArtworkRow[];
    total?: number;
    page?: number;
    pageSize?: number;
    totalPages?: number;
    error?: string;
  };
  if (!body?.ok || !Array.isArray(body.artworks)) {
    throw new Error(`artworks_list_invalid:${body?.error ?? "unknown"}`);
  }
  const total = body.total ?? body.artworks.length;
  const pageSize = body.pageSize ?? body.artworks.length;
  return {
    artworks: body.artworks,
    total,
    page: body.page ?? 1,
    pageSize,
    totalPages: body.totalPages ?? Math.max(1, Math.ceil(total / Math.max(1, pageSize))),
  };
}

export async function fetchProvenanceListingsForOperator(
  actingUserId: string,
  saleMode: "auction" | "fixed",
): Promise<{ listings: ConsoleProvenanceListingRow[]; total: number }> {
  const origin = requireWebOrigin();
  const res = await fetch(
    `${origin}/api/internal/operator/provenance-listings?saleMode=${encodeURIComponent(saleMode)}`,
    {
      headers: internalOperatorHeaders(actingUserId),
      cache: "no-store",
    },
  );
  if (!res.ok) {
    throw new Error(`provenance_list_failed:${res.status}`);
  }
  const body = (await res.json()) as {
    ok?: boolean;
    listings?: ConsoleProvenanceListingRow[];
    total?: number;
    error?: string;
  };
  if (!body?.ok || !Array.isArray(body.listings)) {
    throw new Error(`provenance_list_invalid:${body?.error ?? "unknown"}`);
  }
  return { listings: body.listings, total: body.total ?? body.listings.length };
}

export type FetchIssuedEditionsForOperatorResult = {
  editions: ConsoleIssuedEditionRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function fetchIssuedEditionsForOperator(
  actingUserId: string,
  options: { page?: number; pageSize?: number; q?: string; sort?: string; order?: "asc" | "desc" } = {},
): Promise<FetchIssuedEditionsForOperatorResult> {
  const origin = requireWebOrigin();
  const sp = new URLSearchParams();
  sp.set("page", String(options.page ?? 1));
  sp.set("pageSize", String(options.pageSize ?? 25));
  if (options.q?.trim()) sp.set("q", options.q.trim());
  if (options.sort?.trim()) sp.set("sort", options.sort.trim());
  if (options.order) sp.set("order", options.order);
  const res = await fetch(`${origin}/api/internal/operator/issued-editions?${sp.toString()}`, {
    headers: internalOperatorHeaders(actingUserId),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`issued_editions_failed:${res.status}`);
  }
  const body = (await res.json()) as {
    ok?: boolean;
    editions?: ConsoleIssuedEditionRow[];
    total?: number;
    page?: number;
    pageSize?: number;
    totalPages?: number;
    error?: string;
  };
  if (!body?.ok || !Array.isArray(body.editions)) {
    throw new Error(`issued_editions_invalid:${body?.error ?? "unknown"}`);
  }
  const total = body.total ?? body.editions.length;
  const pageSize = body.pageSize ?? body.editions.length;
  return {
    editions: body.editions,
    total,
    page: body.page ?? 1,
    pageSize,
    totalPages: body.totalPages ?? Math.max(1, Math.ceil(total / Math.max(1, pageSize))),
  };
}

export async function fetchDashboardStatsForOperator(actingUserId: string): Promise<ConsoleDashboardStats> {
  const origin = requireWebOrigin();
  const res = await fetch(`${origin}/api/internal/operator/dashboard-stats`, {
    headers: internalOperatorHeaders(actingUserId),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`dashboard_stats_failed:${res.status}`);
  }
  const body = (await res.json()) as { ok?: boolean; stats?: ConsoleDashboardStats; error?: string };
  if (!body?.ok || !body.stats) {
    throw new Error(`dashboard_stats_invalid:${body?.error ?? "unknown"}`);
  }
  return body.stats;
}
