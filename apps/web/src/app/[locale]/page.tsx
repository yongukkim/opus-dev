import { DesignPhilosophyBand } from "@/components/DesignPhilosophyBand";
import { Hero } from "@/components/Hero";
import { ChroniclePreview } from "@/components/home/ChroniclePreview";
import { MarketingCtaBand } from "@/components/home/MarketingCtaBand";
import { RailCuration } from "@/components/home/RailCuration";
import { RailFeaturedArtists } from "@/components/home/RailFeaturedArtists";
import { RailProvenance } from "@/components/home/RailProvenance";
import { RailReleases } from "@/components/home/RailReleases";
import { StatsTrustRow } from "@/components/home/StatsTrustRow";
import { getDictionary } from "@/i18n/catalog";
import { normalizeLocale, withLocale } from "@/i18n/paths";
import { OpusButton } from "@opus/ui";
import Link from "next/link";

type Props = { params: Promise<{ locale: string }> };

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
 * - The Chronicle preview is still a placeholder; the data wire lands in
 *   PR-9 once the Chronicle write cutover is in place (spec §8).
 */
export default async function HomePage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = normalizeLocale(raw);
  const m = getDictionary(locale);

  return (
    <>
      <Hero locale={locale} m={m} />
      <DesignPhilosophyBand m={m} />
      <main
        id="main-content"
        className="border-t border-opus-gold/10 bg-gradient-to-b from-opus-charcoal via-[#141414] to-opus-charcoal"
      >
        <div className="mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
          <div className="max-w-2xl">
            <p className="opus-text-metallic-soft text-xs font-medium uppercase tracking-[0.4em]">
              {m.home.kicker}
            </p>
            <h1 className="mt-5 font-display text-3xl font-normal leading-tight tracking-wide text-opus-warm md:text-4xl lg:text-[2.65rem]">
              {m.home.title}
            </h1>
            <p className="mt-6 font-sans text-base leading-relaxed text-opus-warm/72 md:text-lg">{m.home.lead}</p>
            <div className="mt-10 flex flex-wrap items-center gap-5">
              <OpusButton variant="primary">{m.home.buyCta}</OpusButton>
              <Link
                href={withLocale(locale, "/legal/specified-commercial")}
                className="text-sm text-opus-warm/55 underline-offset-[5px] transition hover:text-opus-gold hover:underline"
              >
                {m.home.legalLink}
              </Link>
            </div>
          </div>
        </div>

        {/*
          Rail A · Releases (1차 / 新作公開). Per-artwork links + PRIMARY pill
          as of PR-5 (spec §3.3). Data source is still the file-system catalog
          via loadCatalogFiles(); cutover to Edition + Listing(market=PRIMARY)
          is tracked separately in spec §5.
        */}
        <RailReleases locale={locale} m={m} />

        {/*
          Rail B · Provenance (2차 / 来歴). Real data wired in PR-4 from JSONL
          via listOpenCollectorTransferListings(). Placeholder swap-in per
          spec §3.4 / §8 — no IA shift; same slot the placeholder occupied.
        */}
        <RailProvenance locale={locale} m={m} />

        {/*
          Rail C · Featured artists. Wired in PR-6 (spec §3.5):
          filename grouping (≥2 works) + operator picks fallback from
          data/featured-artists.ts. Pen-name-only by ISO 27001 A.18.1.4.
          The card CTA temporarily targets each artist's first PDP until
          /artist/[slug] ships in a follow-up PR.
        */}
        <RailFeaturedArtists locale={locale} m={m} />

        {/*
          Rail D · Operator-curated shelves. Wired in PR-7 (spec §3.6) from
          the static data/curation.ts catalog. The "Browse other shelves"
          CTA temporarily targets /releases until the dedicated /curation
          index page ships in a follow-up PR (spec §8.2).
        */}
        <RailCuration locale={locale} m={m} />

        {/*
          The Chronicle preview placeholder. Real masked custody events land
          in PR-9 once the Chronicle write cutover is in place (spec §3.7).
        */}
        <ChroniclePreview
          title={m.home.chroniclePreview.title}
          body={m.home.chroniclePreview.body}
          comingSoonLabel={m.home.comingSoon}
          ariaLabel={m.home.chroniclePreview.title}
        />

        <StatsTrustRow m={m} />
        <MarketingCtaBand locale={locale} m={m} />
      </main>
    </>
  );
}
