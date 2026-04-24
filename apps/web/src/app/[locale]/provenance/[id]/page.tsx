import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n/catalog";
import type { Messages } from "@/i18n/types";
import { normalizeLocale, withLocale } from "@/i18n/paths";
import { findArtistByPenName } from "@/lib/artistsCatalog";
import {
  findOpenCollectorTransferListing,
  maskSellerId,
} from "@/lib/collectorTransferListings";

/**
 * `/[locale]/provenance/[id]` — PR-18 of the home-redesign series.
 * Spec: docs/home-redesign-curation-rails-and-omnisearch.md §3.4 / §5.
 *
 * Before this PR:
 *   - Rail B cards linked at `/provenance` (the index).
 *   - ⌘K listing results deep-linked to `/provenance#<id>` (hash-only,
 *     the index page did not render anchor ids).
 *   - A single listing had no canonical detail URL.
 *
 * This page is the real detail surface. Rail B, ⌘K, the sitemap, and
 * the `/provenance` index all cut over to `/provenance/[id]` in the
 * same PR.
 *
 * Source of truth: `findOpenCollectorTransferListing(id)` returns the
 * PII-safe public projection (legal name stripped at the lib boundary —
 * ISO 27001 A.18.1.4 / APPI / spec §10). This page never has to
 * re-mask; it only masks the `sellerId` before rendering
 * (`maskSellerId`), preserving the rule Rail B and the index already
 * enforce.
 *
 * Vocabulary: all copy is either i18n chrome, operator-authored catalog
 * fields (artworkTitle, editionRef, genre, year), or seller-authored
 * free-text (description, tags, note). The `.cursorrules` §2 forbidden
 * vocabulary guard runs on the full page HTML during verification.
 *
 * Scope discipline (explicitly out of scope for this cut):
 *   - No purchase / checkout affordance.
 *   - No operator edit controls.
 *
 * PR-20 follow-up: the artist pen name now resolves to
 * `/artist/<slug>` via `findArtistByPenName` when the name matches a
 * `loadArtists()` entry (same selection rule Rail C / ⌘K / the
 * artist page already share — ≥ 2 works grouped or operator pick).
 * Listings whose pen name doesn't match any catalog artist render
 * as plain text, so dead-end links never ship.
 */

type Props = { params: Promise<{ locale: string; id: string }> };

function transferGenreLabel(
  ct: Messages["collectorTransfer"],
  key: string,
): string {
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

function dateLabel(iso: string, locale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const loc =
    locale === "ja" ? "ja-JP" : locale === "ko" ? "ko-KR" : "en-US";
  return d.toLocaleString(loc, { dateStyle: "medium", timeStyle: "short" });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw, id } = await params;
  const locale = normalizeLocale(raw);
  const d = getDictionary(locale);
  const t = d.collectorTransfer;
  const listing = await findOpenCollectorTransferListing(id);
  if (!listing) {
    return {
      title: t.listingsTitle,
      description: t.listingsSubtitle,
    };
  }
  return {
    title: t.listingsDetailMetaTitleTpl.replace("{title}", listing.artworkTitle),
    description: t.listingsDetailMetaDescriptionTpl.replace(
      "{title}",
      listing.artworkTitle,
    ),
  };
}

export default async function ProvenanceDetailPage({ params }: Props) {
  const { locale: raw, id } = await params;
  const locale = normalizeLocale(raw);
  const m = getDictionary(locale);
  const t = m.collectorTransfer;

  const listing = await findOpenCollectorTransferListing(id);
  if (!listing) notFound();

  // Reverse-lookup the pen name against the featured-artist set. If
  // it matches, we wrap the artist field in a link into the artist
  // page. If not, we render plain text — listings can carry pen
  // names that aren't part of `loadArtists()` (e.g. single-work
  // artists without an operator pick), and surfacing a 404-bound
  // link would be a worse UX than no link.
  const artistEntry = await findArtistByPenName(listing.artistPenName);

  const homeHref = withLocale(locale, "/");
  const indexHref = withLocale(locale, "/provenance");
  const artistHref = artistEntry
    ? withLocale(locale, `/artist/${artistEntry.slug}`)
    : null;

  const tagList = (listing.tags ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 24);

  const priceLabel = `¥${listing.priceJpy.toLocaleString("ja-JP")}`;
  const sellerLabel = `${maskSellerId(listing.sellerId)} · ${listing.sellerRole}`;

  return (
    <main className="min-h-screen bg-opus-charcoal px-6 pb-24 pt-[calc(6.5rem+4rem)] text-opus-warm/80">
      <div className="mx-auto max-w-3xl">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-opus-warm/40">
          {t.listingsDetailKicker}
        </p>

        <nav className="mt-4" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-opus-warm/50">
            <li>
              <Link href={homeHref} className="transition hover:text-opus-gold-light">
                {t.listingsDetailBreadcrumbHome}
              </Link>
            </li>
            <li className="text-opus-warm/25" aria-hidden>
              /
            </li>
            <li>
              <Link href={indexHref} className="transition hover:text-opus-gold-light">
                {t.listingsTitle}
              </Link>
            </li>
            <li className="text-opus-warm/25" aria-hidden>
              /
            </li>
            <li className="max-w-[min(100%,22rem)] truncate text-opus-warm/65 sm:max-w-md">
              {listing.artworkTitle}
            </li>
          </ol>
        </nav>

        <header className="mt-8 flex flex-col gap-4 border-t border-white/[0.06] pt-8 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <h1 className="opus-text-metallic font-display text-3xl tracking-wide md:text-4xl">
              {listing.artworkTitle}
            </h1>
            <p className="mt-3 text-sm text-opus-warm/75">
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-opus-warm/40">
                {t.listingsArtistPublic}
              </span>{" "}
              {artistHref ? (
                <Link
                  href={artistHref}
                  aria-label={t.listingsDetailViewArtistAria.replace(
                    "{name}",
                    listing.artistPenName,
                  )}
                  className="text-opus-gold-light underline-offset-4 transition hover:text-opus-gold hover:underline"
                >
                  {listing.artistPenName}
                </Link>
              ) : (
                <span className="text-opus-gold-light">{listing.artistPenName}</span>
              )}
            </p>
            {listing.editionRef ? (
              <p className="mt-2 font-mono text-[0.7rem] tracking-[0.06em] text-opus-warm/45">
                {listing.editionRef}
              </p>
            ) : null}
          </div>
          <span
            className="shrink-0 self-start rounded-full border border-opus-gold/45 bg-opus-gold/10 px-3 py-1 font-mono text-[0.6rem] uppercase tracking-[0.22em] text-opus-gold-light md:self-end"
            aria-label={t.listingsPrice}
          >
            {priceLabel}
          </span>
        </header>

        <section
          className="mt-10 grid gap-4 rounded-xl border border-white/[0.08] bg-opus-slate/20 px-6 py-6 shadow-opus-card sm:grid-cols-2"
          aria-label={t.listingsTitle}
        >
          {listing.genre ? (
            <div>
              <p className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-opus-warm/40">
                {t.listingsGenre}
              </p>
              <p className="mt-1 text-sm text-opus-warm/80">
                {transferGenreLabel(t, listing.genre)}
              </p>
            </div>
          ) : null}
          {listing.year ? (
            <div>
              <p className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-opus-warm/40">
                {t.listingsYear}
              </p>
              <p className="mt-1 text-sm text-opus-warm/80">{listing.year}</p>
            </div>
          ) : null}
          <div>
            <p className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-opus-warm/40">
              {t.listingsSellerRef}
            </p>
            {/*
              Always the masked form (maskSellerId). The raw sellerId
              never leaves the server. This mirrors the rule Rail B + ⌘K
              already enforce.
            */}
            <p className="mt-1 font-mono text-xs text-opus-warm/70">{sellerLabel}</p>
          </div>
          <div>
            <p className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-opus-warm/40">
              {t.listingsListedAt}
            </p>
            <p className="mt-1 text-sm text-opus-warm/75">
              {dateLabel(listing.createdAt, locale)}
            </p>
          </div>
        </section>

        {listing.description ? (
          <section
            className="mt-10 border-t border-white/[0.06] pt-8"
            aria-labelledby="provenance-detail-description"
          >
            <h2
              id="provenance-detail-description"
              className="font-mono text-[0.65rem] uppercase tracking-[0.24em] text-opus-warm/45"
            >
              {t.listingsDetailDescriptionHeading}
            </h2>
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-opus-warm/75">
              {listing.description}
            </p>
          </section>
        ) : null}

        {tagList.length > 0 ? (
          <section
            className="mt-10 border-t border-white/[0.06] pt-8"
            aria-labelledby="provenance-detail-tags"
          >
            <h2
              id="provenance-detail-tags"
              className="font-mono text-[0.65rem] uppercase tracking-[0.24em] text-opus-warm/45"
            >
              {t.listingsDetailTagsHeading}
            </h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {tagList.map((tag) => (
                <li
                  key={tag}
                  className="rounded border border-white/[0.08] bg-black/15 px-2 py-1 text-[0.7rem] text-opus-warm/65"
                >
                  {tag}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {listing.note ? (
          <section
            className="mt-10 border-t border-white/[0.06] pt-8"
            aria-labelledby="provenance-detail-notes"
          >
            <h2
              id="provenance-detail-notes"
              className="font-mono text-[0.65rem] uppercase tracking-[0.24em] text-opus-warm/45"
            >
              {t.listingsDetailNotesHeading}
            </h2>
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-opus-warm/65">
              {listing.note}
            </p>
          </section>
        ) : null}

        <p className="mt-12 border-t border-white/[0.06] pt-8 text-xs leading-relaxed text-opus-warm/40">
          {t.listingsDemoNote}
        </p>

        <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href={indexHref}
            className="text-sm text-opus-gold/80 underline-offset-4 hover:text-opus-gold-light hover:underline"
          >
            {t.listingsDetailBackToIndex}
          </Link>
          <Link
            href={withLocale(locale, "/vault/transfer/register")}
            className="opus-surface-metallic inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-semibold text-black transition hover:opacity-95"
          >
            {t.listingsRegisterCta}
          </Link>
        </div>
      </div>
    </main>
  );
}
