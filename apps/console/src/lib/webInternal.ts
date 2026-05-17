import { mapSubmissionsToArtworkRows } from "./consoleArtworkRows";

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
};

export type ConsoleUserRoleFilter = "artist" | "collector" | "operator";

export async function fetchUsersForOperator(
  actingUserId: string,
  role?: ConsoleUserRoleFilter,
): Promise<{ users: ConsoleMemberRow[]; total: number }> {
  const origin = requireWebOrigin();
  const qs = role ? `?role=${encodeURIComponent(role)}` : "";
  const res = await fetch(`${origin}/api/internal/operator/users${qs}`, {
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
    error?: string;
  };
  if (!body?.ok || !Array.isArray(body.users)) {
    throw new Error(`users_list_invalid:${body?.error ?? "unknown"}`);
  }
  return { users: body.users, total: body.total ?? body.users.length };
}

export async function fetchMembersForOperator(actingUserId: string): Promise<{
  users: ConsoleMemberRow[];
  total: number;
}> {
  return fetchUsersForOperator(actingUserId);
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
  artworkTitle: string;
  editionNumber: number;
  editionTotal: number;
  mintedAt: string | null;
};

export async function fetchArtworksForOperator(actingUserId: string): Promise<{
  artworks: ConsoleArtworkRow[];
  total: number;
}> {
  const raw = await fetchSubmissionsForOperator(actingUserId);
  const artworks = mapSubmissionsToArtworkRows(raw);
  return { artworks, total: artworks.length };
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

export async function fetchIssuedEditionsForOperator(actingUserId: string): Promise<{
  editions: ConsoleIssuedEditionRow[];
  total: number;
}> {
  const origin = requireWebOrigin();
  const res = await fetch(`${origin}/api/internal/operator/issued-editions`, {
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
    error?: string;
  };
  if (!body?.ok || !Array.isArray(body.editions)) {
    throw new Error(`issued_editions_invalid:${body?.error ?? "unknown"}`);
  }
  return { editions: body.editions, total: body.total ?? body.editions.length };
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
