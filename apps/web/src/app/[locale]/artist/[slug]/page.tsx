import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n/catalog";
import { normalizeLocale, withLocale } from "@/i18n/paths";
import { JsonLd } from "@/components/seo/JsonLd";
import { resolveArtistBySlug } from "@/lib/artistsCatalog";
import { loadShelvesForArtistKey } from "@/lib/curationCatalog";
import { buildArtistJsonLd } from "@/lib/jsonLdPdp";

/**
 * `/[locale]/artist/[slug]` — PR-10 cutover for the home redesign series.
 * Spec: docs/home-redesign-curation-rails-and-omnisearch.md §3.5 / §5.
 *
 * Before this PR: Rail C (Featured Artists) and the omni-search artist
 * results both linked into the artist's first PDP as a temporary
 * destination. This page is the real surface they now point at.
 *
 * Source of truth: `loadArtists()` (catalog grouping + operator picks).
 * Cutover to a `User(role=ARTIST)` Prisma query is tracked in spec §5.
 *
 * PII (ISO 27001 A.18.1.4): the visible artist label is the pen name
 * only; the page never reads the submission record or any legal-name
 * column. Cards reuse the `m.badge.primary` channel marker so the home
 * rails / omni-search / artist page all carry the same vocabulary.
 */

type Props = { params: Promise<{ locale: string; slug: string }> };

const WORK_GRID = "mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale = normalizeLocale(raw);
  const d = getDictionary(locale);
  // If the slug resolves, lead with the pen name via the `{name}` token.
  // If not, fall back to the featured-artists index metadata so the 404
  // render (notFound in the page) still has sensible copy while Next.js
  // negotiates the error boundary.
  const artist = await resolveArtistBySlug(slug);
  if (!artist) {
    return {
      title: d.meta.featuredArtistsTitle,
      description: d.meta.featuredArtistsDescription,
    };
  }
  return {
    title: d.meta.artistTitleTpl.replace("{name}", artist.penName),
    description: d.meta.artistDescriptionTpl.replace("{name}", artist.penName),
  };
}

export default async function ArtistPage({ params }: Props) {
  const { locale: raw, slug } = await params;
  const locale = normalizeLocale(raw);
  const artist = await resolveArtistBySlug(slug);
  if (!artist) notFound();

  const m = getDictionary(locale);
  const t = m.artist;

  const homeHref = withLocale(locale, "/");
  const archiveHref = withLocale(locale, "/releases");
  const worksLabel = t.worksCount.replace("{n}", String(artist.works.length));

  const items = artist.works.map((w) => ({
    submissionId: w.submissionId,
    title: w.title,
  }));

  // PR-15: surface operator-curated shelves that include this artist.
  // `loadShelvesForArtistKey` runs the same resolution as Rail D and
  // `/curation`, so a shelf whose refs have all dropped from the live
  // catalog won't render here either.
  const relatedShelves = await loadShelvesForArtistKey(artist.key);
  const ts = t.shelves;
  const firstWorkSubmissionId = artist.works[0]?.submissionId;

  return (
    <>
      <JsonLd
        data={buildArtistJsonLd({
          locale,
          slug,
          penName: artist.penName,
          firstWorkSubmissionId,
        })}
      />
    <main className="min-h-screen bg-opus-charcoal px-6 pb-24 pt-[calc(var(--opus-header-plus-trust)+4rem)] text-opus-warm/80">
      <div className="mx-auto max-w-5xl">
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
            <li>
              <Link href={archiveHref} className="transition hover:text-opus-gold-light">
                {t.breadcrumbReleases}
              </Link>
            </li>
            <li className="text-opus-warm/25" aria-hidden>
              /
            </li>
            <li className="max-w-[min(100%,18rem)] truncate text-opus-warm/65 sm:max-w-md">
              {artist.penName}
            </li>
          </ol>
        </nav>

        <header className="mt-8 flex flex-col gap-3 border-t border-white/[0.06] pt-8 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="opus-text-metallic font-display text-3xl tracking-wide md:text-4xl">
              {artist.penName}
            </h1>
            <p className="mt-3 max-w-xl text-sm text-opus-warm/55">{t.worksLead}</p>
          </div>
          <span className="shrink-0 self-start rounded-full border border-white/[0.12] px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-opus-warm/65 md:self-end">
            {worksLabel}
          </span>
        </header>

        <section className="mt-12" aria-labelledby="artist-works-heading">
          <h2
            id="artist-works-heading"
            className="font-mono text-[0.65rem] uppercase tracking-[0.24em] text-opus-warm/45"
          >
            {t.worksHeading}
          </h2>

          {items.length === 0 ? (
            <p className="mt-8 rounded-lg border border-white/[0.06] bg-opus-slate/20 px-6 py-10 text-center text-sm text-opus-warm/55">
              {t.empty}
            </p>
          ) : (
            <ul className={WORK_GRID}>
              {items.map((item) => (
                <li key={item.submissionId}>
                  <Link
                    href={withLocale(
                      locale,
                      `/releases/submission/${encodeURIComponent(item.submissionId)}`,
                    )}
                    className="group block overflow-hidden rounded-lg border border-white/[0.08] bg-opus-slate/30 shadow-opus-card transition hover:border-opus-gold/38"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-b from-[#1f1f1f] to-opus-charcoal">
                      <Image
                        src={`/api/artwork-submissions/${encodeURIComponent(item.submissionId)}/public-preview`}
                        alt={`${item.title} — ${artist.penName}`}
                        fill
                        sizes="(min-width: 1024px) 220px, (min-width: 640px) 45vw, 90vw"
                        unoptimized
                        className="object-cover opacity-95 transition duration-700 group-hover:scale-[1.02] group-hover:opacity-100"
                      />
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
                      <span className="absolute right-3 top-3 rounded-full border border-opus-gold/45 bg-black/55 px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.22em] text-opus-gold-light backdrop-blur-sm">
                        {m.badge.primary}
                      </span>
                    </div>
                    <div className="border-t border-white/[0.06] px-4 py-4">
                      <p className="opus-text-metallic line-clamp-1 font-display text-sm tracking-wide">
                        {item.title}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {relatedShelves.length > 0 && (
          <section
            className="mt-16 border-t border-white/[0.06] pt-10"
            aria-labelledby="artist-shelves-heading"
          >
            <h2
              id="artist-shelves-heading"
              className="font-mono text-[0.65rem] uppercase tracking-[0.24em] text-opus-warm/45"
            >
              {ts.heading}
            </h2>
            <p className="mt-2 max-w-xl text-sm text-opus-warm/55">{ts.lead}</p>

            <ul className="mt-8 grid gap-4 md:grid-cols-2">
              {relatedShelves.map((s) => (
                <li key={s.id}>
                  <Link
                    href={withLocale(locale, `/curation/${encodeURIComponent(s.id)}`)}
                    className="group flex h-full flex-col justify-between gap-4 rounded-lg border border-white/[0.08] bg-opus-slate/30 px-5 py-5 shadow-opus-card transition hover:border-opus-gold/38"
                  >
                    <div className="min-w-0">
                      <p className="opus-text-metallic font-display text-lg tracking-wide">
                        {s.title[locale]}
                      </p>
                      <p className="mt-2 line-clamp-3 text-sm text-opus-warm/60">
                        {s.description[locale]}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full border border-white/[0.12] px-3 py-1 font-mono text-[0.58rem] uppercase tracking-[0.22em] text-opus-warm/65">
                        {ts.itemsCount.replace("{n}", String(s.itemCount))}
                      </span>
                      <span className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-opus-gold/75 transition group-hover:text-opus-gold-light">
                        {ts.viewShelf} →
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-16 border-t border-white/[0.06] pt-8">
          <Link
            href={archiveHref}
            className="text-sm text-opus-gold/80 underline-offset-4 hover:text-opus-gold-light hover:underline"
          >
            ← {t.backToReleases}
          </Link>
        </div>
      </div>
    </main>
    </>
  );
}
