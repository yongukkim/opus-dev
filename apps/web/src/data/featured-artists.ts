/**
 * Operator-curated "featured artists" picks — phase-1 fallback for Rail C
 * (home page Featured Artists rail). See spec §3.5 / §7.1 of
 * `docs/home-redesign-curation-rails-and-omnisearch.md`.
 *
 * How this list is consumed (PR-6 onward):
 *   1. RailFeaturedArtists groups the public catalog by `parseTitleArtist().artist`
 *      and keeps anyone with ≥2 surfaced works.
 *   2. The rail then merges in any picks from this file that are NOT already
 *      present, deduping by `penName.toLowerCase()`. Picks come first.
 *   3. The rail caps total cards at 4 to match the other rails' rhythm.
 *
 * PII rules (ISO 27001 A.18.1.4 / SECURITY_GOVERNANCE.md §1, spec §3.5):
 * - `penName` is the only public artist label allowed here. Operators MUST
 *   NOT put legal names, email handles, nationality, or any internal user id
 *   into this file. The Listing / submission pipelines already enforce the
 *   pen-name-only contract; this file inherits it.
 * - `artworkFiles` must reference filenames that already live in the public
 *   catalog (`apps/web/public/local-artworks/` or the FALLBACK list in
 *   `lib/artworksCatalog.ts`). Files not present in the active catalog are
 *   silently skipped at render time so a stale pick can never break the home
 *   page.
 *
 * Phase 2 (post-Prisma cutover, separate PR) replaces this file with the
 * `User.where(role=ARTIST)` + `Edition.count(isIssued=true)` query plus the
 * operator-recommendation flag described in spec §3.5.
 */
export type FeaturedArtistPick = {
  /** Public-facing pen name. NEVER a legal name (ISO 27001 A.18.1.4). */
  penName: string;
  /**
   * Filenames (no path) of representative works. The component shows up to
   * three thumbnails per artist. Filenames not present in the live catalog
   * are dropped at render time.
   */
  artworkFiles: readonly string[];
};

/**
 * Currently empty: the demo catalog already groups two pieces under
 * "matsumoto" (matsumoto_14.jpg, matsumoto_15.jpg), which is enough to
 * exercise the rail end-to-end. Operators populate this list as soon as
 * we have a curated pen-name set worth surfacing on the home page.
 */
export const FEATURED_ARTIST_PICKS: readonly FeaturedArtistPick[] = [];
