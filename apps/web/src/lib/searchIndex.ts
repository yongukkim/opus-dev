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
import { loadShelves } from "@/lib/curationCatalog";
import type {
  SearchArtist,
  SearchArtwork,
  SearchIndex,
  SearchListing,
  SearchShelf,
} from "./searchIndex.types";

export type {
  SearchArtist,
  SearchArtwork,
  SearchIndex,
  SearchListing,
  SearchShelf,
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
  const [rawListings, artistEntries, resolvedShelves] = await Promise.all([
    listOpenCollectorTransferListings(),
    loadArtists(),
    // No preview cap: we only need the shelf-level fields (title,
    // description, itemCount). Resolved items themselves aren't carried
    // into the search index — the modal links straight to `/curation/[id]`.
    loadShelves(),
  ]);

  const artworks = buildArtworks(files);
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
    priceJpy: r.priceJpy,
    sellerMasked: maskSellerId(r.sellerId),
    href: localelessHref(`/provenance/${encodeURIComponent(r.id)}`),
    badge: "secondary",
  }));
  // Drop shelves whose refs all fell out of catalog resolution — an
  // empty shelf in ⌘K is a dead-end and the detail page would just show
  // the empty-state copy. Keep the full translation payload so the
  // modal can render the active-locale title/description without a
  // second network hop.
  const shelves: SearchShelf[] = resolvedShelves
    .filter((s) => s.itemCount > 0)
    .map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      itemCount: s.itemCount,
      href: localelessHref(`/curation/${encodeURIComponent(s.id)}`),
    }));

  return {
    generatedAt: new Date().toISOString(),
    artworks,
    artists,
    listings,
    shelves,
  };
}
