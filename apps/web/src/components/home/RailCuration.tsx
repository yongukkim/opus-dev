import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/types";
import { withLocale } from "@/i18n/paths";
import {
  encodeArtworkSlug,
  loadCatalogFiles,
  parseTitleArtist,
} from "@/lib/artworksCatalog";
import { catalogImageSrcFromFile } from "@/lib/catalogImageUrl";
import { CURATION_SHELVES, type CurationShelf } from "@/data/curation";

/**
 * Rail D · Operator-curated shelves — PR-7 of the home redesign series.
 * Spec: docs/home-redesign-curation-rails-and-omnisearch.md §3.6 / §6.
 *
 * Source of truth (phase 1):
 *   1. The first entry in `CURATION_SHELVES` (ordered most-recent-first).
 *   2. Items with `kind: "artwork"` are resolved against `loadCatalogFiles()`
 *      and any ref missing from the live catalog is silently dropped, so a
 *      stale shelf can never break the home page.
 *   3. Other item kinds (`edition`, `listing`) are reserved for the phase-2
 *      operator-edit cutover (separate PR, OpusRole.OPERATOR + audit log)
 *      and ignored here.
 *
 * Layout:
 *   - Section header carries the rail label + the localized rail body and a
 *     "Browse other shelves" link. The link targets `/releases` for now,
 *     because the dedicated `/curation` index page lands in a follow-up PR
 *     (spec §8.2). Only the href changes once that route ships.
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

type ResolvedItem = {
  file: string;
  slug: string;
  title: string;
  artist: string;
};

function resolveShelfItems(
  shelf: CurationShelf,
  catalogFiles: readonly string[],
): ResolvedItem[] {
  const indexByFile = new Map<string, number>();
  for (let i = 0; i < catalogFiles.length; i++) indexByFile.set(catalogFiles[i]!, i);

  const out: ResolvedItem[] = [];
  for (const item of shelf.items) {
    if (item.kind !== "artwork") continue;
    const idx = indexByFile.get(item.ref);
    if (idx === undefined) continue;
    const { title, artist } = parseTitleArtist(item.ref, idx);
    out.push({
      file: item.ref,
      slug: encodeArtworkSlug(item.ref),
      title,
      artist,
    });
    if (out.length >= HOME_SHELF_LIMIT) break;
  }
  return out;
}

export async function RailCuration({
  locale,
  m,
}: {
  locale: Locale;
  m: Messages;
}) {
  const r = m.home.railCuration;
  const shelf = CURATION_SHELVES[0];
  const { files } = await loadCatalogFiles();
  const items = shelf ? resolveShelfItems(shelf, files) : [];
  // Treat a shelf whose every item dropped as "no shelf available" so we fall
  // back to the empty copy instead of rendering an empty grid.
  const shelfHasItems = items.length > 0;

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
          {/*
            Until /curation lands (spec §8.2), this CTA points at /releases
            so the affordance is never broken. Swap the href only.
          */}
          <Link
            href={withLocale(locale, "/releases")}
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
            <div className="flex flex-col gap-1">
              <h3 className="opus-text-metallic font-display text-lg tracking-wide md:text-xl">
                {shelf.title[locale]}
              </h3>
              <p className="font-sans text-sm text-opus-warm/55">
                {shelf.description[locale]}
              </p>
            </div>

            <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
              {items.map((item) => (
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
