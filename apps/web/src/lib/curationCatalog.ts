import {
  encodeArtworkSlug,
  loadCatalogFiles,
  parseTitleArtist,
} from "@/lib/artworksCatalog";
import {
  CURATION_SHELVES,
  type CurationShelf,
} from "@/data/curation";

/**
 * Server-only helper for operator-curated shelves (Rail D + `/curation`).
 * Spec: docs/home-redesign-curation-rails-and-omnisearch.md §3.6 / §6 / §8.2.
 *
 * Centralises the shelf → catalog resolution that previously lived inline in
 * `RailCuration`, so the home rail, the `/curation` index, and the
 * `/curation/[id]` detail page all read from a single source of truth.
 *
 * Compliance:
 *   - Items reference only public catalog filenames; no personal identifier
 *     (legal name, email, sellerId, wallet) reaches this module.
 *   - Items whose ref is missing from the live catalog are silently dropped
 *     so a stale shelf never breaks a public page.
 *   - Phase-2 item kinds (`edition`, `listing`) are reserved for the
 *     operator-edit cutover (`OpusRole.OPERATOR` + audit log) and ignored
 *     here.
 *   - This module is server-only (transitively imports `node:fs/promises`
 *     via `@/lib/artworksCatalog`). Do NOT import from a client component.
 */

export type ResolvedCurationItem = {
  /** Catalog filename (no path). */
  file: string;
  /** URL-safe slug used by `/releases/<slug>`. */
  slug: string;
  /** Filename-derived title (no PII, sourced from the public catalog). */
  title: string;
  /** Filename-derived artist label (pen name only, no PII). */
  artist: string;
};

export type ResolvedShelf = {
  /** Stable, URL-safe identifier (also the `/curation/<id>` segment). */
  id: string;
  title: { ko: string; ja: string; en: string };
  description: { ko: string; ja: string; en: string };
  /** Items that survived the catalog resolution, in shelf order. */
  items: ResolvedCurationItem[];
  /** Total live items on the shelf (post-resolution); convenience for UI. */
  itemCount: number;
};

function buildIndexByFile(catalogFiles: readonly string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (let i = 0; i < catalogFiles.length; i++) m.set(catalogFiles[i]!, i);
  return m;
}

function resolveShelf(
  shelf: CurationShelf,
  catalogFiles: readonly string[],
  indexByFile: Map<string, number>,
  limit?: number,
): ResolvedShelf {
  const items: ResolvedCurationItem[] = [];
  for (const item of shelf.items) {
    if (item.kind !== "artwork") continue;
    const idx = indexByFile.get(item.ref);
    if (idx === undefined) continue;
    const { title, artist } = parseTitleArtist(item.ref, idx);
    items.push({
      file: item.ref,
      slug: encodeArtworkSlug(item.ref),
      title,
      artist,
    });
    if (limit !== undefined && items.length >= limit) break;
  }
  return {
    id: shelf.id,
    title: shelf.title,
    description: shelf.description,
    items,
    itemCount: items.length,
  };
}

/**
 * Resolve all shelves with a per-shelf preview cap. Used by Rail D (cap=4)
 * and the `/curation` index page (cap configurable). Empty shelves
 * (every item dropped post-resolution) are kept in the output so callers
 * can decide how to render them; consumers should filter on `itemCount`
 * if they want to hide them.
 */
export async function loadShelves(previewLimit?: number): Promise<ResolvedShelf[]> {
  const { files } = await loadCatalogFiles();
  const indexByFile = buildIndexByFile(files);
  return CURATION_SHELVES.map((s) => resolveShelf(s, files, indexByFile, previewLimit));
}

/**
 * Resolve a single shelf by id (no cap), for `/curation/[id]`. Returns
 * `null` if no shelf matches the id, so the page route can call
 * `notFound()`. A shelf with zero resolved items is still returned (the
 * detail page handles it via an empty-state copy).
 */
export async function loadShelfById(id: string): Promise<ResolvedShelf | null> {
  const shelf = CURATION_SHELVES.find((s) => s.id === id);
  if (!shelf) return null;
  const { files } = await loadCatalogFiles();
  const indexByFile = buildIndexByFile(files);
  return resolveShelf(shelf, files, indexByFile);
}

/**
 * The first shelf, capped to `limit` items. Convenience for Rail D so the
 * home page never accidentally shows the second shelf.
 */
export async function loadFirstShelf(limit: number): Promise<ResolvedShelf | null> {
  const shelf = CURATION_SHELVES[0];
  if (!shelf) return null;
  const { files } = await loadCatalogFiles();
  const indexByFile = buildIndexByFile(files);
  return resolveShelf(shelf, files, indexByFile, limit);
}
