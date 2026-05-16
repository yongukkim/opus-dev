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

export async function fetchMembersForOperator(actingUserId: string): Promise<{
  users: ConsoleMemberRow[];
  total: number;
}> {
  const origin = requireWebOrigin();
  const res = await fetch(`${origin}/api/internal/operator/users`, {
    headers: internalOperatorHeaders(actingUserId),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`members_list_failed:${res.status}`);
  }
  const body = (await res.json()) as {
    ok?: boolean;
    users?: ConsoleMemberRow[];
    total?: number;
    error?: string;
  };
  if (!body?.ok || !Array.isArray(body.users)) {
    throw new Error(`members_list_invalid:${body?.error ?? "unknown"}`);
  }
  return { users: body.users, total: body.total ?? body.users.length };
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
