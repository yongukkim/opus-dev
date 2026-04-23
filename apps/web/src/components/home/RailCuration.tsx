import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/types";
import { withLocale } from "@/i18n/paths";
import { catalogImageSrcFromFile } from "@/lib/catalogImageUrl";
import { loadFirstShelf } from "@/lib/curationCatalog";

// PR-11: shelf card now exposes both per-work PDP links AND a "Open this
// shelf" CTA (→ /curation/<id>). Avoid nesting <Link> inside <Link> by
// keeping the outer container a plain element and giving each artwork
// card / the shelf-detail CTA their own anchor.

/**
 * Rail D · Operator-curated shelves — PR-7 of the home redesign series,
 * cut over to `/curation` in PR-11.
 * Spec: docs/home-redesign-curation-rails-and-omnisearch.md §3.6 / §6 / §8.2.
 *
 * Source of truth (phase 1):
 *   - `loadFirstShelf(HOME_SHELF_LIMIT)` — the first entry in
 *     `CURATION_SHELVES` (most-recent-first), capped to four cards.
 *   - Items with `kind: "artwork"` are resolved against the live catalog
 *     and any ref missing from the live catalog is silently dropped, so a
 *     stale shelf can never break the home page.
 *   - Other item kinds (`edition`, `listing`) are reserved for the phase-2
 *     operator-edit cutover (separate PR, OpusRole.OPERATOR + audit log)
 *     and ignored by the helper.
 *
 * Layout:
 *   - Section header carries the rail label + the localized rail body and a
 *     "Browse other shelves" link that targets `/curation` (PR-11). Each
 *     shelf card already links into `/curation/<id>`.
 *   - One shelf rendered as a 4-card grid: shelf title and description (read
 *     directly from the static catalog so we don't pollute the i18n catalog
 *     with operator-authored copy), then four artwork cards linking to each
 *     PDP via `encodeArtworkSlug`.
 *
 * Compliance:
 *   - No personal identifier (legal name, email, sellerId, wallet) reaches
 *     this component. Items reference public catalog filenames only and the
 *     visible artist label is filename-derived via `parseTitleArtist`.
 *   - Operator-authored shelf copy must be reviewed against the
 *     `.cursorrules` forbidden-vocabulary list (no investment / advisory /
 *     yield language) at the point it lands in `data/curation.ts`.
 */
const HOME_SHELF_LIMIT = 4;

export async function RailCuration({
  locale,
  m,
}: {
  locale: Locale;
  m: Messages;
}) {
  const r = m.home.railCuration;
  const shelf = await loadFirstShelf(HOME_SHELF_LIMIT);
  // Treat a shelf whose every item dropped as "no shelf available" so we fall
  // back to the empty copy instead of rendering an empty grid.
  const shelfHasItems = (shelf?.itemCount ?? 0) > 0;

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
            href={withLocale(locale, "/curation")}
            className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-opus-gold/85 transition hover:text-opus-gold-light"
          >
            {r.viewAll} →
          </Link>
        </div>

        {!shelf || !shelfHasItems ? (
          <p className="mt-12 rounded-lg border border-white/[0.06] bg-opus-slate/20 px-6 py-10 text-center text-sm text-opus-warm/55">
            {r.empty}
          </p>
        ) : (
          <div className="mt-10 rounded-lg border border-white/[0.08] bg-gradient-to-b from-opus-slate/30 to-[#161616] p-6 shadow-opus-card md:p-8">
            <div className="flex flex-col items-start gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h3 className="opus-text-metallic font-display text-lg tracking-wide md:text-xl">
                  {shelf.title[locale]}
                </h3>
                <p className="mt-1 font-sans text-sm text-opus-warm/55">
                  {shelf.description[locale]}
                </p>
              </div>
              <Link
                href={withLocale(locale, `/curation/${shelf.id}`)}
                className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-opus-gold/85 transition hover:text-opus-gold-light"
              >
                {m.curation.viewShelf} →
              </Link>
            </div>

            <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
              {shelf.items.map((item) => (
                <li key={item.file}>
                  <Link
                    href={withLocale(locale, `/releases/${item.slug}`)}
                    className="group block overflow-hidden rounded-md border border-white/[0.08] bg-opus-slate/30 transition hover:border-opus-gold/38"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-b from-[#1f1f1f] to-opus-charcoal">
                      <Image
                        src={catalogImageSrcFromFile(item.file, "thumb")}
                        alt={`${item.title} — ${item.artist}`}
                        fill
                        sizes="(min-width: 1024px) 220px, (min-width: 640px) 45vw, 90vw"
                        unoptimized
                        className="object-cover opacity-90 transition duration-500 group-hover:opacity-100"
                      />
                    </div>
                    <div className="border-t border-white/[0.06] px-4 py-3">
                      <p className="opus-text-metallic line-clamp-1 font-display text-sm tracking-wide">
                        {item.title}
                      </p>
                      <p className="mt-1 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-opus-warm/45">
                        {item.artist}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
