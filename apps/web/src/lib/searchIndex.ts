import {
  encodeArtworkSlug,
  loadCatalogFiles,
  parseTitleArtist,
} from "@/lib/artworksCatalog";
import {
  listOpenCollectorTransferListings,
  maskSellerId,
} from "@/lib/collectorTransferListings";
import { loadArtists } from "@/lib/artistsCatalog";
import { listApprovedPrimaryReleasesForRail } from "@/lib/primaryReleasesForRail";
import { buildGenreSearchTextBlob } from "@/lib/genreQuickKeywords";
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
 * MVP: built per-request on the server (route `revalidate` + Cache-Control)
 * and shipped as JSON; the client refetches when the modal opens so new
 * `genre` / keyword fields are not stuck behind a stale first fetch.
 *
 * PII contract (ISO 27001 A.18.1.4 / SECURITY_GOVERNANCE.md §1):
 *   - artworks: filename-derived catalog rows (optional) plus approved
 *     primary-release submissions (`/releases/submission/<id>`) with
 *     `genre` for quick-keyword omni-search (see `genreKeywordSearchMap`).
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
  const [rawListings, artistEntries, primaryReleases] = await Promise.all([
    listOpenCollectorTransferListings(),
    loadArtists(),
    listApprovedPrimaryReleasesForRail(),
  ]);

  const submissionArtworks: SearchArtwork[] = primaryReleases.map((rec) => ({
    slug: `submission:${rec.id}`,
    title: rec.artworkTitle,
    artistPenName: (rec.nickname?.trim() || rec.artistName).trim() || "—",
    href: localelessHref(`/releases/submission/${rec.id}`),
    badge: "primary",
    genre: rec.genre,
    genreSearchText: buildGenreSearchTextBlob(rec.genre),
  }));
  const catalogArtworks = buildArtworks(files);
  const artworks = [...submissionArtworks, ...catalogArtworks];
  // Artist results now point at the real `/artist/<slug>` page (PR-10
  // cutover). The selection rule + slug encoding live in
  // `lib/artistsCatalog` so Rail C, the artist page, and the omni-search
  // index all agree on the same artist set.
  const artists: SearchArtist[] = artistEntries.map((a) => ({
    id: a.key,
    penName: a.penName,
    worksCount: a.works.length,
    href: localelessHref(`/artist/${a.slug}`),
  }));
  const listings: SearchListing[] = rawListings.map((r) => ({
    id: r.id,
    artworkTitle: r.artworkTitle,
    artistPenName: r.artistPenName,
    saleMode: r.saleMode ?? "fixed",
    priceJpy: r.priceJpy,
    sellerMasked: maskSellerId(r.sellerId),
    href: localelessHref(`/provenance/${encodeURIComponent(r.id)}`),
    badge: "secondary",
    genre: r.genre,
    genreSearchText: buildGenreSearchTextBlob(r.genre),
  }));
  return {
    generatedAt: new Date().toISOString(),
    artworks,
    artists,
    listings,
    shelves: [],
  };
}
