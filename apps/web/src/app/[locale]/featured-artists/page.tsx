import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getDictionary } from "@/i18n/catalog";
import { normalizeLocale, withLocale } from "@/i18n/paths";
import { loadArtists } from "@/lib/artistsCatalog";

/**
 * `/[locale]/featured-artists` — Rail C "Browse all artists" cutover
 * (PR-12 of the home redesign series, follow-up to PR-10).
 * Spec: docs/home-redesign-curation-rails-and-omnisearch.md §3.5 / §6.
 *
 * Source of truth: `loadArtists()` (the same selection rule the home
 * Rail C uses — ≥ 2 catalog works OR an operator pick). Each card
 * links into the existing `/[locale]/artist/[slug]` page from PR-10.
 *
 * PII (ISO 27001 A.18.1.4): pen names only, no submission record /
 * legal-name column ever read. Operator-picked artists get a small
 * visual chip ("Editor's pick") so the curation hand is visible
 * without leaking any identity claim about the artist themselves.
 */

const THUMBS_PER_CARD = 3;
const ARTIST_GRID = "mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = normalizeLocale(raw);
  const d = getDictionary(locale);
  return {
    title: d.meta.featuredArtistsTitle,
    description: d.meta.featuredArtistsDescription,
  };
}

export default async function FeaturedArtistsIndexPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = normalizeLocale(raw);
  const m = getDictionary(locale);
  const t = m.featuredArtists;

  const homeHref = withLocale(locale, "/");
  const artists = await loadArtists();

  return (
    <main className="min-h-screen bg-opus-charcoal px-6 pb-24 pt-[calc(var(--opus-header-plus-trust)+4rem)] text-opus-warm/80">
      <div className="mx-auto max-w-6xl">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-opus-warm/40">
          {t.kicker}
        </p>

        <nav className="mt-4" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-opus-warm/50">
            <li>
              <Link href={homeHref} className="transition hover:text-opus-gold-light">
                {t.breadcrumbHome}
              </Link>
            </li>
            <li className="text-opus-warm/25" aria-hidden>
              /
            </li>
            <li className="text-opus-warm/65">{t.breadcrumbIndex}</li>
          </ol>
        </nav>

        <header className="mt-8 border-t border-white/[0.06] pt-8">
          <h1 className="opus-text-metallic font-display text-3xl tracking-wide md:text-4xl">
            {t.indexHeading}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-opus-warm/55">{t.indexLead}</p>
        </header>

        {artists.length === 0 ? (
          <p className="mt-12 rounded-lg border border-white/[0.06] bg-opus-slate/20 px-6 py-10 text-center text-sm text-opus-warm/55">
            {t.indexEmpty}
          </p>
        ) : (
          <ul className={ARTIST_GRID}>
            {artists.map((entry) => {
              const thumbs = entry.works.slice(0, THUMBS_PER_CARD);
              const ctaHref = withLocale(locale, `/artist/${entry.slug}`);
              const worksLabel = t.worksCount.replace("{n}", String(entry.works.length));
              return (
                <li key={entry.key}>
                  <Link
                    href={ctaHref}
                    className="group flex h-full flex-col gap-4 overflow-hidden rounded-lg border border-white/[0.08] bg-gradient-to-b from-opus-slate/30 to-[#161616] p-5 shadow-opus-card transition hover:border-opus-gold/38"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
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
                        {entry.isOperatorPick ? (
                          <span className="mt-2 inline-block rounded-full border border-opus-gold/45 bg-black/40 px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.2em] text-opus-gold-light">
                            {t.operatorPickBadge}
                          </span>
                        ) : null}
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
                      {t.viewProfile} →
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
