import {
  parseTitleArtist,
} from "@/lib/artworksCatalog";
import { listAllSubmissions } from "@/lib/privateStorage";
import {
  FEATURED_ARTIST_PICKS,
  type FeaturedArtistPick,
} from "@/data/featured-artists";
import { getArtistSsoImageOptInMap } from "@/lib/artistPublicProfile";
import { prisma } from "@/lib/prisma";

/**
 * Server-only artist resolver — backs `/[locale]/artist/[slug]`, the
 * Featured Artists rail (Rail C), and the omni-search artist results.
 *
 * Selection rule (mirrors spec §3.5):
 *   1. Group the public catalog by `parseTitleArtist(file).artist`,
 *      dropping the `Unknown` fallback and any pen name with < 2 works.
 *   2. Merge in `FEATURED_ARTIST_PICKS` — operator-curated picks always
 *      qualify even with a single representative work; they take card
 *      priority over grouped entries (editorial intent leads).
 *   3. The same `ArtistEntry` shape is returned everywhere so callers
 *      stay consistent (slug, pen name, ordered files, first index).
 *
 * PII (ISO 27001 A.18.1.4 / SECURITY_GOVERNANCE.md §1):
 *   - The visible label is `penName` only — filename-derived or
 *     operator-set. No legal name, email, or internal user id reaches
 *     this module. Operator picks are intentionally pen-name-shaped
 *     (see `data/featured-artists.ts` JSDoc).
 *
 * Slugging:
 *   - `encodeArtistSlug(penName)` is base64url over the lowercased pen
 *     name, mirroring `encodeArtworkSlug` (URL-safe, transport-safe in
 *     all locales). The decoded value is range-checked the same way.
 */

const MIN_WORKS_FOR_GROUPED_ARTIST = 1;

export type ArtistWork = {
  submissionId: string;
  title: string;
  createdAt: string;
};

export type ArtistEntry = {
  /** URL-safe identifier (base64url over the lowercased pen name). */
  slug: string;
  /** Lowercased pen name; stable id for dedup + cmdk values. */
  key: string;
  /** Visible pen name (display casing). */
  penName: string;
  /** Works the artist owns, ordered as in the live catalog. */
  works: ArtistWork[];
  /** True when the entry was added by `FEATURED_ARTIST_PICKS`. */
  isOperatorPick: boolean;
  /** Optional opt-in profile image from the artist's SSO account. */
  profileImageUrl?: string;
};

export function encodeArtistSlug(penName: string): string {
  return Buffer.from(penName.toLowerCase(), "utf8").toString("base64url");
}

export function decodeArtistSlug(slug: string): string | null {
  try {
    const decoded = Buffer.from(slug, "base64url").toString("utf8");
    if (!decoded || decoded.length > 256) return null;
    if (decoded.includes("\0") || decoded.includes("/") || decoded.includes("\\")) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

function groupApprovedSubmissions(): Promise<Map<string, ArtistEntry>> {
  return listAllSubmissions().then((submissions) => {
  const map = new Map<string, ArtistEntry>();
    for (const rec of submissions) {
      if ((rec.reviewStatus ?? "pending_review") !== "approved") continue;
      const penName = (rec.nickname || rec.artistName || "").trim();
      if (!penName) continue;
      const key = penName.toLowerCase();
      const work: ArtistWork = {
        submissionId: rec.id,
        title: rec.artworkTitle || parseTitleArtist(rec.storedFile.filename, 0).title,
        createdAt: rec.createdAt,
      };
      const prev = map.get(key);
      if (prev) {
        prev.works.push(work);
      } else {
        map.set(key, {
          slug: encodeArtistSlug(penName),
          key,
          penName,
          works: [work],
          isOperatorPick: false,
        });
      }
    }
    for (const row of map.values()) {
      row.works.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    }
    return map;
  });
}

function mergeOperatorPicks(
  groupedMap: Map<string, ArtistEntry>,
  picks: readonly FeaturedArtistPick[],
): ArtistEntry[] {
  const pickEntries: ArtistEntry[] = [];
  for (const pick of picks) {
    const key = pick.penName.toLowerCase();
    const prev = groupedMap.get(key);
    if (prev && prev.works.length > 0) {
      prev.isOperatorPick = true;
      groupedMap.delete(key);
      pickEntries.push(prev);
    } else {
      const syntheticWorks = pick.artworkFiles.map((f, i) => ({
        submissionId: `pick:${pick.penName}:${i}`,
        title: parseTitleArtist(f, i).title,
        createdAt: new Date(0).toISOString(),
      }));
      if (syntheticWorks.length > 0) {
        pickEntries.push({
          slug: encodeArtistSlug(pick.penName),
          key,
          penName: pick.penName,
          works: syntheticWorks,
          isOperatorPick: true,
        });
      }
    }
  }

  const grouped = [...groupedMap.values()].filter(
    (e) => e.works.length >= MIN_WORKS_FOR_GROUPED_ARTIST,
  );
  const all = [...pickEntries, ...grouped];
  return all;
}

function sortArtists(
  entries: ArtistEntry[],
  latestReleaseByArtistKey: ReadonlyMap<string, number>,
): ArtistEntry[] {
  const all = [...entries];
  all.sort((a, b) => {
    const latestA = latestReleaseByArtistKey.get(a.key) ?? 0;
    const latestB = latestReleaseByArtistKey.get(b.key) ?? 0;
    return (
      latestB - latestA ||
      b.works.length - a.works.length ||
      a.penName.localeCompare(b.penName)
    );
  });
  return all;
}

async function loadLatestReleaseByArtistKey(): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  const submissions = await listAllSubmissions();
  for (const rec of submissions) {
    if ((rec.reviewStatus ?? "pending_review") !== "approved") continue;
    const penName = (rec.nickname || rec.artistName || "").trim().toLowerCase();
    if (!penName) continue;
    const ts = Date.parse(rec.createdAt);
    if (!Number.isFinite(ts)) continue;
    const prev = out.get(penName) ?? 0;
    if (ts > prev) out.set(penName, ts);
  }
  return out;
}

function sanitizeHttpUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return undefined;
    return parsed.toString();
  } catch {
    return undefined;
  }
}

async function loadLatestArtistIdByPenNameKey(): Promise<Map<string, string>> {
  const out = new Map<string, { artistId: string; ts: number }>();
  const submissions = await listAllSubmissions();
  for (const rec of submissions) {
    if ((rec.reviewStatus ?? "pending_review") !== "approved") continue;
    const key = (rec.nickname || rec.artistName || "").trim().toLowerCase();
    if (!key) continue;
    const artistId = rec.artistId.trim();
    if (!artistId) continue;
    const ts = Date.parse(rec.createdAt);
    if (!Number.isFinite(ts)) continue;
    const prev = out.get(key);
    if (!prev || ts > prev.ts) out.set(key, { artistId, ts });
  }
  return new Map([...out.entries()].map(([k, v]) => [k, v.artistId]));
}

async function attachArtistProfileImages(entries: ArtistEntry[]): Promise<ArtistEntry[]> {
  if (entries.length === 0) return entries;
  const [artistIdByKey, imageOptInByArtistId] = await Promise.all([
    loadLatestArtistIdByPenNameKey(),
    getArtistSsoImageOptInMap(),
  ]);
  const artistIds = [...new Set([...artistIdByKey.values()])];
  if (artistIds.length === 0) return entries;
  const users = await prisma.user.findMany({
    where: { id: { in: artistIds } },
    select: { id: true, image: true },
  });
  const imageByArtistId = new Map(
    users.map((u) => [u.id, sanitizeHttpUrl(u.image)] as const),
  );
  return entries.map((entry) => {
    const artistId = artistIdByKey.get(entry.key);
    if (!artistId) return entry;
    if (!imageOptInByArtistId.get(artistId)) return entry;
    const image = imageByArtistId.get(artistId);
    if (!image) return entry;
    return { ...entry, profileImageUrl: image };
  });
}

/** All eligible artists (operator picks + ≥ 2 works grouping). */
export async function loadArtists(): Promise<ArtistEntry[]> {
  const [grouped, latestReleaseByArtistKey] = await Promise.all([
    groupApprovedSubmissions(),
    loadLatestReleaseByArtistKey(),
  ]);
  const merged = mergeOperatorPicks(grouped, FEATURED_ARTIST_PICKS);
  const sorted = sortArtists(merged, latestReleaseByArtistKey);
  return attachArtistProfileImages(sorted);
}

/** Single artist by URL slug, or null if the slug doesn't resolve. */
export async function resolveArtistBySlug(slug: string): Promise<ArtistEntry | null> {
  const decoded = decodeArtistSlug(slug);
  if (!decoded) return null;
  const artists = await loadArtists();
  return artists.find((a) => a.key === decoded) ?? null;
}

/**
 * Reverse lookup: pen name (as it appears on public surfaces) → entry,
 * or null if the name doesn't match any `loadArtists()` result (e.g.
 * a listing whose pen name doesn't coincide with a catalog artist).
 *
 * Used by `/provenance/[id]` (PR-20) to decide whether the artist
 * field should render as a deep link into `/artist/[slug]` or stay
 * as plain text. Comparison uses the same lowercased `key` the
 * selection rules (group-by ≥2 works, operator picks) already emit,
 * so the surface set in omni-search / Rail C / featured-artists /
 * artist-page cross-links stays consistent.
 */
export async function findArtistByPenName(
  penName: string,
): Promise<ArtistEntry | null> {
  const key = penName.trim().toLowerCase();
  if (!key) return null;
  const artists = await loadArtists();
  return artists.find((a) => a.key === key) ?? null;
}
