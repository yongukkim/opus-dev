import type { Metadata } from "next";
import { ProvenanceListingPreviewImage } from "@/components/provenance/ProvenanceListingPreviewImage";
import { getDictionary } from "@/i18n/catalog";
import type { Messages } from "@/i18n/types";
import { normalizeLocale, withLocale } from "@/i18n/paths";
import {
  getPreviewSubmissionIdsForListings,
  listOpenCollectorTransferListings,
  maskSellerId,
} from "@/lib/collectorTransferListings";
import Link from "next/link";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ saleMode?: string }>;
};

export const dynamic = "force-dynamic";

/**
 * PR-19 — fills the metadata gap PR-16 left for `/provenance`. Static
 * copy; the detail page (`/provenance/[id]`, PR-18) already owns per-
 * listing titles/descriptions. Vocabulary follows the provenance /
 * 来歴 / 소장 계보 contract in `.cursorrules` §2.
 */
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  const { saleMode } = await searchParams;
  const locale = normalizeLocale(raw);
  const d = getDictionary(locale);
  if (saleMode === "auction") {
    return {
      title: d.meta.provenanceAuctionIndexTitle,
      description: d.meta.provenanceAuctionIndexDescription,
    };
  }
  return {
    title: d.meta.provenanceIndexTitle,
    description: d.meta.provenanceIndexDescription,
  };
}

function dateLabel(iso: string, locale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const loc = locale === "ja" ? "ja-JP" : locale === "ko" ? "ko-KR" : "en-US";
  return d.toLocaleString(loc, { dateStyle: "medium", timeStyle: "short" });
}

function remainingLabel(ms: number): string | null {
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const totalMinutes = Math.floor(ms / 60_000);
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  if (hours < 48) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function transferGenreLabel(ct: Messages["collectorTransfer"], key: string): string {
  const map: Record<string, string> = {
    "digital-painting": ct.genreOptDigitalPainting,
    illustration: ct.genreOptIllustration,
    photography: ct.genreOptPhotography,
    "3d": ct.genreOpt3d,
    generative: ct.genreOptGenerative,
    video: ct.genreOptVideo,
    "mixed-media": ct.genreOptMixedMedia,
    other: ct.genreOptOther,
  };
  return map[key] || key || "—";
}

export default async function CollectorTransferListingsPage({ params, searchParams }: Props) {
  const { locale: raw } = await params;
  const { saleMode: saleModeRaw } = await searchParams;
  const locale = normalizeLocale(raw);
  const m = getDictionary(locale);
  const t = m.collectorTransfer;
  const saleModeFilter =
    saleModeRaw === "auction" || saleModeRaw === "fixed" ? saleModeRaw : null;
  const allRows = await listOpenCollectorTransferListings();
  const rows = saleModeFilter
    ? allRows.filter((r) => r.saleMode === saleModeFilter)
    : allRows;

  const previewSubmissionByListingId = await getPreviewSubmissionIdsForListings(rows);

  return (
    <main className="min-h-screen px-6 pb-24 pt-[calc(var(--opus-header-plus-trust)+4rem)] text-opus-warm/80">
      <div className="mx-auto max-w-3xl">
        <p className="opus-text-metallic-soft text-center text-xs uppercase tracking-[0.35em]">OPUS</p>
        <h1 className="mt-4 text-center font-display text-2xl text-opus-warm md:text-3xl">{t.listingsTitle}</h1>
        <p className="mx-auto mt-4 max-w-xl text-center text-sm text-opus-warm/55">{t.listingsSubtitle}</p>
        {saleModeFilter === "auction" ? (
          <p className="mx-auto mt-3 max-w-xl text-center text-xs leading-relaxed text-opus-gold/75">
            {t.listingsAuctionFilterHint}
          </p>
        ) : null}

        {rows.length === 0 ? (
          <p className="mt-14 text-center text-sm text-opus-warm/45">
            {saleModeFilter === "auction" ? t.listingsEmptyAuctionFilter : t.listingsEmpty}
          </p>
        ) : (
          <ul className="mt-12 space-y-4">
            {rows.map((r) => {
              const tagList = (r.tags ?? "")
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean)
                .slice(0, 12);
              const auction = r.saleMode === "auction" ? r.auction : undefined;
              const showAuctionSummary = auction?.visibility?.showAuctionSummary !== false;
              const endAtMs = auction?.endAt ? new Date(auction.endAt).getTime() : Number.NaN;
              const endsIn = remainingLabel(endAtMs - Date.now());
              const auctionSummary =
                r.saleMode === "auction" && auction && showAuctionSummary
                  ? [
                      `${t.auctionSummaryStarting} ¥${auction.startingBidJpy.toLocaleString("ja-JP")}`,
                      typeof auction.reservePriceJpy === "number"
                        ? `${t.auctionSummaryReserve} ¥${auction.reservePriceJpy.toLocaleString("ja-JP")}`
                        : "",
                      typeof auction.buyoutPriceJpy === "number"
                        ? `${t.auctionSummaryBuyout} ¥${auction.buyoutPriceJpy.toLocaleString("ja-JP")}`
                        : "",
                      typeof auction.minIncrementJpy === "number"
                        ? `${t.auctionSummaryMinIncrement} +¥${auction.minIncrementJpy.toLocaleString("ja-JP")}`
                        : "",
                      auction.endAt ? `${t.auctionSummaryEnds} ${dateLabel(auction.endAt, locale)}` : "",
                    ]
                      .filter(Boolean)
                      .join(" · ")
                  : null;
              return (
                <li key={r.id}>
                  <Link
                    href={withLocale(locale, `/provenance/${encodeURIComponent(r.id)}`)}
                    className="group flex flex-col gap-4 rounded-xl border border-white/[0.08] bg-opus-slate/20 p-5 shadow-opus-card transition hover:border-opus-gold/38 sm:flex-row sm:items-stretch sm:gap-5"
                  >
                  <ProvenanceListingPreviewImage
                    submissionId={previewSubmissionByListingId.get(r.id)}
                    artworkTitle={r.artworkTitle}
                    frameClassName="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg bg-gradient-to-b from-[#1f1f1f] to-opus-charcoal sm:aspect-auto sm:h-[7.5rem] sm:w-[10.5rem]"
                    sizes="(min-width: 640px) 168px, 90vw"
                  />
                  <div className="min-w-0 flex-1">
                  <p className="font-display text-lg text-opus-warm transition group-hover:text-opus-gold-light">{r.artworkTitle}</p>
                  <p className="mt-1 text-sm text-opus-gold/90">
                    <span className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-opus-warm/35">
                      {t.listingsArtistPublic}
                    </span>{" "}
                    {r.artistPenName}
                  </p>
                  {r.editionRef ? (
                    <p className="mt-1 font-mono text-[0.7rem] text-opus-warm/45">{r.editionRef}</p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                    {r.genre ? (
                      <span className="text-opus-warm/55">
                        <span className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-opus-warm/35">
                          {t.listingsGenre}
                        </span>{" "}
                        {transferGenreLabel(t, r.genre)}
                      </span>
                    ) : null}
                    {r.year ? (
                      <span className="text-opus-warm/55">
                        <span className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-opus-warm/35">
                          {t.listingsYear}
                        </span>{" "}
                        {r.year}
                      </span>
                    ) : null}
                    <span className="text-opus-warm/55">
                      <span className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-opus-warm/35">
                        {t.listingsPrice}
                      </span>{" "}
                      <span className="text-opus-gold-light">¥{r.priceJpy.toLocaleString("ja-JP")}</span>
                      <span className="ml-1.5 font-mono text-[0.62rem] tracking-[0.06em] text-opus-warm/40">
                        ·{" "}
                        {r.saleMode === "auction" ? t.listingsSaleModeAuction : t.listingsSaleModeFixed}
                      </span>
                      {r.saleMode === "auction" && endsIn ? (
                        <span className="ml-2 font-mono text-[0.62rem] tracking-[0.06em] text-opus-gold/65">
                          · {t.auctionEndsInShort.replace("{t}", endsIn)}
                        </span>
                      ) : null}
                    </span>
                    <span className="text-opus-warm/50">
                      <span className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-opus-warm/35">
                        {t.listingsSellerRef}
                      </span>{" "}
                      {maskSellerId(r.sellerId)} · {r.sellerRole}
                    </span>
                    <span className="text-opus-warm/45">
                      <span className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-opus-warm/35">
                        {t.listingsListedAt}
                      </span>{" "}
                      {dateLabel(r.createdAt, locale)}
                    </span>
                  </div>
                  {r.description ? (
                    <p className="mt-3 text-sm leading-relaxed text-opus-warm/55">{r.description}</p>
                  ) : null}
                  {auctionSummary ? (
                    <p className="mt-3 text-xs leading-relaxed text-opus-warm/50">{auctionSummary}</p>
                  ) : null}
                  {tagList.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {tagList.map((tag) => (
                        <span
                          key={tag}
                          className="rounded border border-white/[0.08] bg-black/10 px-2 py-1 text-[0.7rem] text-opus-warm/60"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {r.note ? <p className="mt-3 text-sm leading-relaxed text-opus-warm/50">{r.note}</p> : null}
                  </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <p className="mx-auto mt-10 max-w-xl text-center text-xs leading-relaxed text-opus-warm/40">{t.listingsDemoNote}</p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href={withLocale(locale, "/vault/collection")}
            className="opus-surface-metallic inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-semibold text-black transition hover:opacity-95"
          >
            {t.listingsRegisterCta}
          </Link>
          <Link
            href={withLocale(locale, "/")}
            className="text-sm text-opus-gold/80 underline-offset-4 hover:text-opus-gold-light hover:underline"
          >
            {t.listingsBackHome}
          </Link>
        </div>
      </div>
    </main>
  );
}
