import {
  encodeArtworkSlug,
  loadCatalogFiles,
  parseTitleArtist,
} from "@/lib/artworksCatalog";
import {
  listOpenCollectorTransferListings,
  maskSellerId,
} from "@/lib/collectorTransferListings";
import {
  FEATURED_ARTIST_PICKS,
  type FeaturedArtistPick,
} from "@/data/featured-artists";
import type {
  SearchArtist,
  SearchArtwork,
  SearchIndex,
  SearchListing,
} from "./searchIndex.types";

export type {
  SearchArtist,
  SearchArtwork,
  SearchIndex,
  SearchListing,
} from "./searchIndex.types";
export { SEARCH_INDEX_PATH } from "./searchIndex.types";

/**
 * Omni-search index — PR-8 (spec §4.3 / §4.4 of
 * `docs/home-redesign-curation-rails-and-omnisearch.md`).
 *
 * MVP: built per-request on the server with `revalidate=3600` and
 * shipped as a single static-feeling JSON to the client. The client
 * caches it in memory after the first modal open and runs substring
 * matching itself (no external fuzzy library — keeps the bundle thin
 * and lets us guard the matching surface for forbidden vocabulary).
 *
 * PII contract (ISO 27001 A.18.1.4 / SECURITY_GOVERNANCE.md §1):
 *   - artworks: filename-derived title + filename-derived pen name
 *     (`parseTitleArtist`). No legal name reaches the index.
 *   - artists: pen name only. Operator picks from
 *     `data/featured-artists.ts` carry the same pen-name-only contract.
 *   - listings: `sellerId` is reduced to `maskSellerId(sellerId)` BEFORE
 *     it lands in the index. The raw seller id never leaves the server.
 *     `artistLegalName` is already stripped at
 *     `listOpenCollectorTransferListings()`.
 *
 * Vocabulary: this builder MUST NOT introduce any string. Every label is
 * derived from existing public data structures, so the `.cursorrules` §2
 * forbidden-vocabulary guard is preserved transitively.
 */
/**
 * Locale-prefix helper that does not depend on `next/navigation` so it can
 * run inside a route handler. The omni-search modal carries the active
 * locale from the client side and rewrites hrefs at render time, so the
 * index ships locale-less paths.
 */
function localelessHref(p: string): string {
  return p.startsWith("/") ? p : `/${p}`;
}

/**
 * Mirrors the Rail C (Featured Artists) selection rule: keep an artist
 * only when they have ≥ 2 catalog works OR they are an operator pick.
 * This filters out filename-derived noise (numeric pinterest-style ids
 * that `parseTitleArtist` happens to split as the "artist" segment).
 */
const MIN_WORKS_FOR_GROUPED_ARTIST = 2;

function buildArtists(
  files: readonly string[],
  picks: readonly FeaturedArtistPick[],
): SearchArtist[] {
  const groups = new Map<
    string,
    { penName: string; firstFile: string; count: number; isPick: boolean }
  >();
  for (let i = 0; i < files.length; i++) {
    const file = files[i]!;
    const { artist } = parseTitleArtist(file, i);
    if (!artist || artist === "Unknown") continue;
    const key = artist.toLowerCase();
    const prev = groups.get(key);
    if (prev) {
      prev.count += 1;
    } else {
      groups.set(key, { penName: artist, firstFile: file, count: 1, isPick: false });
    }
  }

  const indexByFile = new Map<string, number>();
  for (let i = 0; i < files.length; i++) indexByFile.set(files[i]!, i);

  for (const pick of picks) {
    const key = pick.penName.toLowerCase();
    const validFiles = pick.artworkFiles.filter((f) => indexByFile.has(f));
    if (validFiles.length === 0) continue;
    const existing = groups.get(key);
    if (existing) {
      existing.isPick = true;
    } else {
      groups.set(key, {
        penName: pick.penName,
        firstFile: validFiles[0]!,
        count: validFiles.length,
        isPick: true,
      });
    }
  }

  const out: SearchArtist[] = [];
  for (const [key, g] of groups) {
    if (!g.isPick && g.count < MIN_WORKS_FOR_GROUPED_ARTIST) continue;
    out.push({
      id: key,
      penName: g.penName,
      worksCount: g.count,
      href: localelessHref(`/releases/${encodeArtworkSlug(g.firstFile)}`),
    });
  }
  out.sort((a, b) => b.worksCount - a.worksCount || a.penName.localeCompare(b.penName));
  return out;
}

function buildArtworks(files: readonly string[]): SearchArtwork[] {
  const out: SearchArtwork[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i]!;
    const { title, artist } = parseTitleArtist(file, i);
    out.push({
      slug: encodeArtworkSlug(file),
      title,
      artistPenName: artist,
      href: localelessHref(`/releases/${encodeArtworkSlug(file)}`),
      badge: "primary",
    });
  }
  return out;
}

export async function buildSearchIndex(): Promise<SearchIndex> {
  const { files } = await loadCatalogFiles();
  const rawListings = await listOpenCollectorTransferListings();

  const artworks = buildArtworks(files);
  const artists = buildArtists(files, FEATURED_ARTIST_PICKS);
  const listings: SearchListing[] = rawListings.map((r) => ({
    id: r.id,
    artworkTitle: r.artworkTitle,
    artistPenName: r.artistPenName,
    priceJpy: r.priceJpy,
    sellerMasked: maskSellerId(r.sellerId),
    href: localelessHref(`/provenance#${encodeURIComponent(r.id)}`),
    badge: "secondary",
  }));

  return {
    generatedAt: new Date().toISOString(),
    artworks,
    artists,
    listings,
  };
}
