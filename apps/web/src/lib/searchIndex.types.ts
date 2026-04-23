/**
 * Client-safe types + constants for the omni-search index (PR-8).
 * Lives in its own file so the client bundle (Provider, Modal) can import
 * them without dragging the server-only `searchIndex.ts` builder, which
 * pulls `node:fs/promises` via the catalog + JSONL helpers.
 */

export const SEARCH_INDEX_PATH = "/api/search/index.json";

export type SearchArtwork = {
  /** URL-safe slug used by /releases/<slug>. */
  slug: string;
  title: string;
  artistPenName: string;
  /** Locale-less href; the modal prepends the active locale at click time. */
  href: string;
  badge: "primary";
};

export type SearchArtist = {
  id: string;
  penName: string;
  worksCount: number;
  href: string;
};

export type SearchListing = {
  id: string;
  artworkTitle: string;
  artistPenName: string;
  priceJpy: number;
  /** Already masked at index build time via `maskSellerId`. */
  sellerMasked: string;
  href: string;
  badge: "secondary";
};

export type SearchIndex = {
  generatedAt: string;
  artworks: SearchArtwork[];
  artists: SearchArtist[];
  listings: SearchListing[];
};
