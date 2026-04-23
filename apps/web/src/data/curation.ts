/**
 * Operator-curated shelves — phase-1 static catalog for Rail D
 * (home page Curation rail). See spec §3.6 / §7.1 of
 * `docs/home-redesign-curation-rails-and-omnisearch.md`.
 *
 * How this list is consumed (PR-7 onward):
 *   1. RailCuration takes the FIRST shelf in `CURATION_SHELVES` (spec §3.6:
 *      "홈에서는 가장 최근 1개 셸프만 보여주고…"). Order in this file is the
 *      source-of-truth for "most recent".
 *   2. For each shelf item, refs are resolved against the live catalog
 *      (`apps/web/public/local-artworks/` or the FALLBACK list in
 *      `lib/artworksCatalog.ts`). Items whose ref is not in the active
 *      catalog are silently skipped at render time so a stale shelf cannot
 *      break the home page.
 *   3. The rail caps the rendered shelf to four artwork cards to keep
 *      vertical rhythm aligned with the other rails.
 *
 * Phase 2 (separate PR, requires `OpusRole.OPERATOR` and audit logging
 * per SECURITY_GOVERNANCE.md §3.4) replaces this file with rows from
 * `/api/operator/curation` written by an operator-only edit page. Each
 * shelf write must produce a `ChronicleEntry` with `actor=OPERATOR`.
 *
 * Compliance:
 * - Items reference only public catalog filenames (or, in phase 2,
 *   `editionId` / `listingId`). No personal identifier ever appears here.
 * - Shelf copy is operator-authored marketing/editorial text. It MUST NOT
 *   include investment, advisory, or yield language (.cursorrules
 *   forbidden vocabulary list, JFSA / FSC posture).
 */

export type CurationItemKind = "artwork" | "edition" | "listing";

export type CurationItem = {
  /** PR-7 only resolves `kind: "artwork"` against the public catalog. */
  kind: CurationItemKind;
  /**
   * For `artwork`, this is the catalog filename (no path). For `edition`
   * and `listing` (phase 2), this is the corresponding domain id; the
   * Phase-1 RailCuration silently ignores those kinds.
   */
  ref: string;
};

export type CurationShelf = {
  /** Stable, URL-safe identifier (used by /curation/<id> in a later PR). */
  id: string;
  title: { ko: string; ja: string; en: string };
  description: { ko: string; ja: string; en: string };
  items: readonly CurationItem[];
};

/**
 * Most-recent-first. Empty array is a valid state — the rail falls back
 * to its localized empty copy (`home.railCuration.empty`).
 */
export const CURATION_SHELVES: readonly CurationShelf[] = [
  {
    id: "editors-first-selection",
    title: {
      ko: "에디터스 픽 · 첫 셸프",
      ja: "エディターズ・ピック · 最初のシェルフ",
      en: "Editor's pick · The first shelf",
    },
    description: {
      ko: "운영팀이 처음 골라본 작품 모음입니다.",
      ja: "運営チームが最初に選んだ作品です。",
      en: "A first selection by the operator team.",
    },
    items: [
      { kind: "artwork", ref: "matsumoto_14.jpg" },
      { kind: "artwork", ref: "matsumoto_15.jpg" },
      { kind: "artwork", ref: "1.jpg" },
      {
        kind: "artwork",
        ref: "rectangle_large_type_2_d6f5c7c7445fbf81470a956e42959e2a.webp",
      },
    ],
  },
];
