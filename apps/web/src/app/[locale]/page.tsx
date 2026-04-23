import { DesignPhilosophyBand } from "@/components/DesignPhilosophyBand";
import { Hero } from "@/components/Hero";
import { ArchivePreviewGrid } from "@/components/home/ArchivePreviewGrid";
import { ChroniclePreview } from "@/components/home/ChroniclePreview";
import { MarketingCtaBand } from "@/components/home/MarketingCtaBand";
import { RailPlaceholder } from "@/components/home/RailPlaceholder";
import { RailProvenance } from "@/components/home/RailProvenance";
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
 * - The 3-pillar text grid (Chronicle / Vault / Premieres) was retired here:
 *   Rails B–D and the Chronicle preview below cover the same ground without
 *   duplicating it (spec §2).
 * - ArchivePreviewGrid still serves Rail A (Releases) for now; PR-5 swaps it
 *   for a per-artwork-linked RailReleases (spec §3.3, §7.2).
 * - Rails B–D and Chronicle preview are placeholders; their data wires land
 *   in PR-4..PR-7 and PR-9 respectively (spec §8).
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
          Rail A · Releases (1차 / 新作公開). Currently fed by the file-system
          catalog via ArchivePreviewGrid. PR-5 replaces this with RailReleases
          which links each card to its individual /releases/[slug] page and
          renders a PRIMARY badge per spec §3.3.
        */}
        <ArchivePreviewGrid locale={locale} m={m} />

        {/*
          Rail B · Provenance (2차 / 来歴). Real data wired in PR-4 from JSONL
          via listOpenCollectorTransferListings(). Placeholder swap-in per
          spec §3.4 / §8 — no IA shift; same slot the placeholder occupied.
        */}
        <RailProvenance locale={locale} m={m} />

        {/* Rail C · Featured artists. Real data lands in PR-6 (spec §3.5). */}
        <RailPlaceholder
          title={m.home.railFeaturedArtists.title}
          body={m.home.railFeaturedArtists.body}
          comingSoonLabel={m.home.comingSoon}
          ariaLabel={m.home.railFeaturedArtists.title}
        />

        {/* Rail D · Operator-curated shelves. Real data lands in PR-7 (spec §3.6). */}
        <RailPlaceholder
          title={m.home.railCuration.title}
          body={m.home.railCuration.body}
          comingSoonLabel={m.home.comingSoon}
          ariaLabel={m.home.railCuration.title}
        />

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
