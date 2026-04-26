import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/types";
import { withLocale } from "@/i18n/paths";
import {
  listOpenCollectorTransferListings,
  maskSellerId,
} from "@/lib/collectorTransferListings";

/**
 * Rail B · Provenance — PR-4 of the home redesign series.
 * Spec: docs/home-redesign-curation-rails-and-omnisearch.md §3.4 (card spec)
 *       and §6 (copy table). Replaces the placeholder added in PR-3.
 *
 * Data source (this PR): JSONL via `listOpenCollectorTransferListings()`.
 * The PII-safe public projection (`CollectorTransferListingPublic`) already
 * strips `artistLegalName` (ISO 27001 A.18.1.4 / spec §10), so this component
 * never has to re-mask the artist field — it surfaces `artistPenName` only.
 *
 * The seller identity, on the other hand, is a real internal id and MUST be
 * masked here (`maskSellerId`) before rendering, mirroring the rule the
 * Chronicle preview will follow when it lands real data in PR-9 (spec §3.7).
 *
 * The cutover to `Listing.where(market=SECONDARY, status=OPEN)` is tracked
 * separately (spec §5, "Rail B Provenance"). As of PR-18, card links now
 * resolve to `/provenance/[id]` (the dedicated detail surface) — Rail B,
 * ⌘K, the sitemap, and the `/provenance` index all share the same deep
 * link.
 */
export async function RailProvenance({
  locale,
  m,
}: {
  locale: Locale;
  m: Messages;
}) {
  const r = m.home.railProvenance;
  const all = await listOpenCollectorTransferListings();
  const sorted = [...all].sort((a, b) => {
    const pa = a.saleMode === "auction" ? 0 : 1;
    const pb = b.saleMode === "auction" ? 0 : 1;
    if (pa !== pb) return pa - pb;
    return a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0;
  });
  // Cap to four; auction-mode listings surface first. Full lists: `/provenance`, `?saleMode=auction`.
  const items = sorted.slice(0, 4);

  return (
    <section
      className="border-t border-white/[0.05] py-16 md:py-20"
      aria-label={r.title}
    >
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 className="opus-text-metallic font-display text-2xl tracking-wide md:text-3xl">
              {r.title}
            </h2>
            <p className="mt-3 max-w-lg font-sans text-sm text-opus-warm/55">
              {r.body}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
            <Link
              href={withLocale(locale, "/provenance?saleMode=auction")}
              className="border border-opus-gold/42 px-5 py-2.5 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-opus-gold transition hover:border-opus-gold-light/55 hover:bg-opus-gold/10"
            >
              {r.viewAuctions}
            </Link>
            <Link
              href={withLocale(locale, "/provenance")}
              className="border border-white/[0.12] px-5 py-2.5 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-opus-warm/70 transition hover:border-opus-gold/35 hover:text-opus-gold"
            >
              {r.viewAll}
            </Link>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="mt-12 flex flex-col items-center gap-5 rounded-lg border border-white/[0.06] bg-opus-slate/20 px-6 py-14 text-center">
            <p className="text-sm text-opus-warm/60">{r.empty}</p>
            <Link
              href={withLocale(locale, "/vault/collection")}
              className="opus-surface-metallic inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-semibold text-black transition hover:opacity-95"
            >
              {r.registerCta}
            </Link>
          </div>
        ) : (
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {items.map((listing) => (
              <li key={listing.id}>
                <Link
                  href={withLocale(locale, `/provenance/${encodeURIComponent(listing.id)}`)}
                  className="group flex h-full flex-col gap-4 overflow-hidden rounded-lg border border-white/[0.08] bg-gradient-to-b from-opus-slate/30 to-[#161616] p-5 shadow-opus-card transition hover:border-opus-gold/38"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="opus-text-metallic line-clamp-2 font-display text-base leading-snug tracking-wide">
                        {listing.artworkTitle}
                      </p>
                      <p className="mt-1 truncate font-sans text-xs text-opus-warm/55">
                        {listing.artistPenName}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full border border-opus-gold/35 px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.22em] text-opus-gold/85">
                      {m.badge.secondary}
                    </span>
                  </div>

                  {listing.editionRef ? (
                    <p className="font-mono text-[0.65rem] tracking-[0.06em] text-opus-warm/50">
                      {listing.editionRef}
                    </p>
                  ) : null}

                  <div className="mt-auto flex items-end justify-between gap-3 pt-2">
                    <div>
                      <p className="font-display text-lg text-opus-gold-light">
                        ¥{listing.priceJpy.toLocaleString("ja-JP")}
                      </p>
                      {listing.saleMode === "auction" ? (
                        <p className="mt-0.5 font-mono text-[0.55rem] uppercase tracking-[0.14em] text-opus-gold/75">
                          {m.collectorTransfer.listingsSaleModeAuction}
                        </p>
                      ) : null}
                    </div>
                    {/*
                      Seller ref is the masked internal id (ISO 27001 A.18.1.4).
                      Never the raw sellerId; never the artist legal name.
                    */}
                    <p className="font-mono text-[0.62rem] text-opus-warm/45">
                      {maskSellerId(listing.sellerId)}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
