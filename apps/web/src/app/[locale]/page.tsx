import { Hero } from "@/components/Hero";
import { HomeDiscoveryStrip } from "@/components/home/HomeDiscoveryStrip";
import { RailFeaturedArtists } from "@/components/home/RailFeaturedArtists";
import { RailProvenance } from "@/components/home/RailProvenance";
import { RailReleases } from "@/components/home/RailReleases";
import { OmniSearchHintCard } from "@/components/search/OmniSearchHintCard";
import { getDictionary } from "@/i18n/catalog";
import { normalizeLocale } from "@/i18n/paths";

type Props = { params: Promise<{ locale: string }> };

/** Always read live `storage/` + submissions for rails; avoids stale static shells on deploy. */
export const dynamic = "force-dynamic";

/**
 * Home page IA — PR-3 of the home redesign series.
 * Spec: docs/home-redesign-curation-rails-and-omnisearch.md §2 (AFTER) and §3.
 *
 * - The 3-pillar text grid (Chronicle / Vault / Premieres) was retired in
 *   PR-3: Rails B–D and the Chronicle preview below cover the same ground
 *   without duplicating it (spec §2).
 * - Rail A (Releases) is per-artwork as of PR-5 (spec §3.3 / §7.2);
 *   ArchivePreviewGrid was deleted in the same PR.
 * - Rail B (Provenance) is data-driven as of PR-4 (spec §3.4).
 * - Rail C (Featured artists) is data-driven as of PR-6 (spec §3.5):
 *   filename grouping (≥2 works) + operator picks fallback.
 * - Rail D (Curated shelves) is data-driven as of PR-7 (spec §3.6) from
 *   the static `data/curation.ts` catalog.
 * - The Chronicle preview is finalized as an empty-state card in PR-9
 *   (spec §3.7). Phase-2 wires real `ChronicleEntry` rows once the
 *   Chronicle write cutover is in place; only the card body changes,
 *   the masking contract is already committed in copy.
 * - `StatsTrustRow` (week / month / year picks) is **not rendered** for now;
 *   restore by importing `@/components/home/StatsTrustRow` and placing
 *   `<StatsTrustRow m={m} />` after `RailCuration` when editorial picks return.
 * - §3.2 `OmniSearchHintCard` between `Hero` and `<main>`: search-bar
 *   affordance that calls the same `open()` as ⌘K / the header trigger
 *   (`OmniSearchProvider` in `[locale]/layout.tsx`).
 * - `HomeDiscoveryStrip` after the hint card: three-up “Business row”-style
 *   links (About / Releases / Artists) in OPUS chrome; pattern reference
 *   enterprise landings such as [AhnLab CloudMate](https://ahnlabcloudmate.com/).
 */
export default async function HomePage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = normalizeLocale(raw);
  const m = getDictionary(locale);

  return (
    <>
      <Hero locale={locale} m={m} />
      <OmniSearchHintCard
        prompt={m.search.hintCardPrompt}
        ariaLabel={m.search.hintCardAriaLabel}
        chip={m.search.triggerChip}
        ja={locale === "ja"}
      />
      <HomeDiscoveryStrip locale={locale} m={m} />
      <main
        id="main-content"
        className="border-t border-opus-gold/10 bg-gradient-to-b from-opus-charcoal via-[#141414] to-opus-charcoal"
      >
        {/*
          Rail A · Releases — primary (artist-held) approved submissions only
          (`RailReleases` → `listApprovedPrimaryReleasesForRail`).
        */}
        <RailReleases locale={locale} m={m} />

        {/*
          Rail B · Provenance (2차 / 来歴). Real data wired in PR-4 from JSONL
          via listOpenCollectorTransferListings(). Placeholder swap-in per
          spec §3.4 / §8 — no IA shift; same slot the placeholder occupied.
        */}
        <RailProvenance locale={locale} m={m} saleMode="fixed" />
        <RailProvenance locale={locale} m={m} saleMode="auction" />

        {/*
          Rail C · Featured artists. Wired in PR-6 (spec §3.5):
          filename grouping (≥2 works) + operator picks fallback from
          data/featured-artists.ts. Pen-name-only by ISO 27001 A.18.1.4.
          The card CTA temporarily targets each artist's first PDP until
          /artist/[slug] ships in a follow-up PR.
        */}
        <RailFeaturedArtists locale={locale} m={m} />

      </main>
    </>
  );
}
