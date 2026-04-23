import {
  loadCatalogFiles,
  parseTitleArtist,
} from "@/lib/artworksCatalog";
import {
  FEATURED_ARTIST_PICKS,
  type FeaturedArtistPick,
} from "@/data/featured-artists";

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

const MIN_WORKS_FOR_GROUPED_ARTIST = 2;

export type ArtistWork = {
  file: string;
  /** Position of `file` inside `loadCatalogFiles().files` (for slug + idx). */
  globalIndex: number;
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

function groupCatalog(catalogFiles: readonly string[]): Map<string, ArtistEntry> {
  const map = new Map<string, ArtistEntry>();
  for (let i = 0; i < catalogFiles.length; i++) {
    const file = catalogFiles[i]!;
    const { artist } = parseTitleArtist(file, i);
    // `Unknown` is the explicit fallback; never surface it as a pen name.
    if (!artist || artist === "Unknown") continue;
    const key = artist.toLowerCase();
    const prev = map.get(key);
    if (prev) {
      prev.works.push({ file, globalIndex: i });
    } else {
      map.set(key, {
        slug: encodeArtistSlug(artist),
        key,
        penName: artist,
        works: [{ file, globalIndex: i }],
        isOperatorPick: false,
      });
    }
  }
  return map;
}

function mergeOperatorPicks(
  groupedMap: Map<string, ArtistEntry>,
  picks: readonly FeaturedArtistPick[],
  catalogFiles: readonly string[],
): ArtistEntry[] {
  const indexByFile = new Map<string, number>();
  for (let i = 0; i < catalogFiles.length; i++) indexByFile.set(catalogFiles[i]!, i);

  const pickEntries: ArtistEntry[] = [];
  for (const pick of picks) {
    const key = pick.penName.toLowerCase();
    const validWorks: ArtistWork[] = [];
    for (const f of pick.artworkFiles) {
      const idx = indexByFile.get(f);
      if (idx === undefined) continue;
      validWorks.push({ file: f, globalIndex: idx });
    }
    if (validWorks.length === 0) continue;
    const existing = groupedMap.get(key);
    if (existing) {
      existing.isOperatorPick = true;
      // Operator picks dictate display order; we'll move it to the front.
      groupedMap.delete(key);
      pickEntries.push(existing);
    } else {
      pickEntries.push({
        slug: encodeArtistSlug(pick.penName),
        key,
        penName: pick.penName,
        works: validWorks,
        isOperatorPick: true,
      });
    }
  }

  const grouped = [...groupedMap.values()].filter(
    (e) => e.works.length >= MIN_WORKS_FOR_GROUPED_ARTIST,
  );
  // Picks first, then grouped (sorted by works count desc, name asc).
  grouped.sort(
    (a, b) => b.works.length - a.works.length || a.penName.localeCompare(b.penName),
  );
  return [...pickEntries, ...grouped];
}

/** All eligible artists (operator picks + ≥ 2 works grouping). */
export async function loadArtists(): Promise<ArtistEntry[]> {
  const { files } = await loadCatalogFiles();
  const grouped = groupCatalog(files);
  return mergeOperatorPicks(grouped, FEATURED_ARTIST_PICKS, files);
}

/** Single artist by URL slug, or null if the slug doesn't resolve. */
export async function resolveArtistBySlug(slug: string): Promise<ArtistEntry | null> {
  const decoded = decodeArtistSlug(slug);
  if (!decoded) return null;
  const artists = await loadArtists();
  return artists.find((a) => a.key === decoded) ?? null;
}
