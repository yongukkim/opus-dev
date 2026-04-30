import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/types";
import { withLocale } from "@/i18n/paths";
import { loadArtists } from "@/lib/artistsCatalog";

/**
 * Rail C · Featured Artists — PR-6 of the home redesign series, with
 * PR-10 (per-card cutover to `/artist/<slug>`) and PR-12 (header
 * "Browse all artists" → `/featured-artists`) applied.
 * Spec: docs/home-redesign-curation-rails-and-omnisearch.md §3.5 / §6.
 *
 * The grouping + operator-pick merge logic lives in `lib/artistsCatalog`
 * so the rail, the artist page, the artist index, and the omni-search
 * index all share a single source of truth (same selection rule).
 *
 * PII (ISO 27001 A.18.1.4): pen names only — see `artistsCatalog.ts`
 * JSDoc for the full contract.
 */
const HOME_RAIL_LIMIT = 4;
const THUMBS_PER_CARD = 3;

export async function RailFeaturedArtists({
  locale,
  m,
}: {
  locale: Locale;
  m: Messages;
}) {
  const r = m.home.railFeaturedArtists;
  const artists = await loadArtists();
  const items = artists.slice(0, HOME_RAIL_LIMIT);

  return (
    <section
      className="border-t border-white/[0.05] py-16 md:py-20"
      aria-label={r.title}
    >
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <div className="flex flex-col items-start gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="opus-text-metallic font-display text-2xl tracking-wide md:text-3xl">
              {r.title}
            </h2>
            <p className="mt-3 max-w-lg font-sans text-sm text-opus-warm/55">
              {r.body}
            </p>
          </div>
          <Link
            href={withLocale(locale, "/featured-artists")}
            className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-opus-gold/85 transition hover:text-opus-gold-light"
          >
            {r.viewAll} →
          </Link>
        </div>

        {items.length === 0 ? (
          <p className="mt-12 rounded-lg border border-white/[0.06] bg-opus-slate/20 px-6 py-10 text-center text-sm text-opus-warm/55">
            {r.empty}
          </p>
        ) : (
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {items.map((entry) => {
              const thumbs = entry.works.slice(0, THUMBS_PER_CARD);
              const ctaHref = withLocale(locale, `/artist/${entry.slug}`);
              const worksLabel = r.worksCount.replace(
                "{n}",
                String(entry.works.length),
              );
              return (
                <li key={entry.key}>
                  <Link
                    href={ctaHref}
                    className="group flex h-full flex-col gap-4 overflow-hidden rounded-lg border border-white/[0.08] bg-gradient-to-b from-opus-slate/30 to-[#161616] p-5 shadow-opus-card transition hover:border-opus-gold/38"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        {entry.profileImageUrl ? (
                          <Image
                            src={entry.profileImageUrl}
                            alt=""
                            width={28}
                            height={28}
                            className="h-7 w-7 rounded-full border border-white/[0.16] object-cover"
                            unoptimized
                          />
                        ) : null}
                        <p className="opus-text-metallic line-clamp-1 font-display text-base tracking-wide">
                          {entry.penName}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full border border-white/[0.12] px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.2em] text-opus-warm/55">
                        {worksLabel}
                      </span>
                    </div>

                    {/*
                      Up to three thumbnails for visual identity. Decorative
                      from the link's perspective — the surrounding card link
                      already announces the destination, so each thumbnail's
                      alt is empty and the strip is aria-hidden.
                    */}
                    <div className="grid grid-cols-3 gap-1.5" aria-hidden>
                      {thumbs.map((w) => (
                        <div
                          key={w.submissionId}
                          className="relative aspect-square overflow-hidden rounded border border-white/[0.06] bg-gradient-to-b from-[#1f1f1f] to-opus-charcoal"
                        >
                          <Image
                            src={`/api/artwork-submissions/${encodeURIComponent(w.submissionId)}/public-preview`}
                            alt=""
                            fill
                            sizes="(min-width: 1024px) 90px, (min-width: 640px) 22vw, 30vw"
                            unoptimized
                            className="object-cover opacity-90 transition duration-500 group-hover:opacity-100"
                          />
                        </div>
                      ))}
                    </div>

                    <p className="mt-auto font-mono text-[0.62rem] uppercase tracking-[0.22em] text-opus-gold/85 transition group-hover:text-opus-gold-light">
                      {r.viewWorks} →
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
