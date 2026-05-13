/**
 * Client-safe types + constants for the omni-search index (PR-8).
 * Lives in its own file so the client bundle (Provider, Modal) can import
 * them without dragging the server-only `searchIndex.ts` builder, which
 * pulls `node:fs/promises` via the catalog + JSONL helpers.
 */

export const SEARCH_INDEX_PATH = "/api/search/index.json";

export type SearchArtwork = {
  /** URL-safe slug used by /releases/<slug> or `submission:<id>` for submission releases. */
  slug: string;
  title: string;
  artistPenName: string;
  /** Locale-less href; the modal prepends the active locale at click time. */
  href: string;
  badge: "primary";
  /** OPUS genre slug when row comes from an approved submission; catalog files omit this. */
  genre?: string;
  /** Quick-pick + slug tokens for substring search (server-built; no PII beyond public genre labels). */
  genreSearchText?: string;
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
  /** Omitted in stale cached indexes → treat as fixed in UI. */
  saleMode?: "fixed" | "auction";
  priceJpy: number;
  /** Already masked at index build time via `maskSellerId`. */
  sellerMasked: string;
  href: string;
  badge: "secondary";
  /** OPUS genre slug from listing JSONL (optional for older index payloads). */
  genre?: string;
  /** Quick-pick + slug tokens for substring search. */
  genreSearchText?: string;
};

/**
 * Operator-curated shelf entry (PR-14). The index carries one row per
 * shelf with a preview-free, translation-aware payload: the modal picks
 * the active locale's title/description at render time. `itemCount` is
 * the post-resolution count (catalog hits only), which means shelves
 * whose refs all drop in resolution land as `itemCount === 0` and
 * should be filtered out of the index at build time.
 */
export type SearchShelf = {
  id: string;
  title: { ko: string; ja: string; en: string };
  description: { ko: string; ja: string; en: string };
  itemCount: number;
  href: string;
};

export type SearchIndex = {
  generatedAt: string;
  artworks: SearchArtwork[];
  artists: SearchArtist[];
  listings: SearchListing[];
  shelves: SearchShelf[];
};
