/**
 * Client-safe genre keys for artwork submission + collector transfer flows.
 * Kept separate from `collectorTransferListings` (Node fs) so Turbopack never
 * pulls `node:fs/promises` into client chunks.
 */

/** Stable slug keys for artwork submission + collector transfer forms (KO labels in i18n). */
export const OPUS_ARTWORK_GENRE_KEYS = [
  "illustration",
  "pixel-art",
  "sf",
  "anime-style",
  "manga-style",
  "animated-gif",
  "character-art",
  "cinemagraph",
] as const;

export type OpusArtworkGenreKey = (typeof OPUS_ARTWORK_GENRE_KEYS)[number];

/** Must match artwork submission genre keys (`ArtworkSubmissionForm`, API POST). */
export const COLLECTOR_TRANSFER_GENRES = new Set<string>(OPUS_ARTWORK_GENRE_KEYS);
