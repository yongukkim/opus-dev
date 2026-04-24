import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getDictionary } from "@/i18n/catalog";
import { normalizeLocale, withLocale } from "@/i18n/paths";
import { catalogImageSrcFromFile } from "@/lib/catalogImageUrl";
import { loadShelves } from "@/lib/curationCatalog";

/**
 * `/[locale]/curation` — operator-curated shelves index (PR-11 cutover).
 * Spec: docs/home-redesign-curation-rails-and-omnisearch.md §3.6 / §6 / §8.2.
 *
 * Before this PR: Rail D's "Browse other shelves" CTA pointed at /releases
 * because no /curation surface existed yet. This page is the real index;
 * Rail D is cut over to it in the same PR.
 *
 * Source of truth: `loadShelves()` reads `CURATION_SHELVES` and resolves
 * each item against the live public catalog. Phase-2 will swap the data
 * source for `/api/operator/curation` rows; UI/IA stays unchanged.
 *
 * Compliance:
 *   - All copy on this page is either UI chrome (i18n) or operator-authored
 *     shelf metadata from `data/curation.ts` (vocabulary-guarded by
 *     `.cursorrules`).
 *   - No personal identifier (legal name, email, sellerId, wallet) reaches
 *     this page; cards reference public catalog filenames only.
 */

const SHELF_PREVIEW_LIMIT = 4;

const SHELF_GRID = "mt-12 grid gap-8 lg:grid-cols-2";
const PREVIEW_GRID = "mt-6 grid gap-3 grid-cols-2 sm:grid-cols-4";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = normalizeLocale(raw);
  const d = getDictionary(locale);
  return {
    title: d.meta.curationIndexTitle,
    description: d.meta.curationIndexDescription,
  };
}

export default async function CurationIndexPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = normalizeLocale(raw);
  const m = getDictionary(locale);
  const t = m.curation;

  const homeHref = withLocale(locale, "/");
  const shelves = (await loadShelves(SHELF_PREVIEW_LIMIT)).filter(
    (s) => s.itemCount > 0,
  );

  return (
    <main className="min-h-screen bg-opus-charcoal px-6 pb-24 pt-[calc(6.5rem+4rem)] text-opus-warm/80">
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
            <li className="text-opus-warm/65">{t.breadcrumbIndex}</li>
          </ol>
        </nav>

        <header className="mt-8 border-t border-white/[0.06] pt-8">
          <h1 className="opus-text-metallic font-display text-3xl tracking-wide md:text-4xl">
            {t.indexHeading}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-opus-warm/55">{t.indexLead}</p>
        </header>

        {shelves.length === 0 ? (
          <p className="mt-12 rounded-lg border border-white/[0.06] bg-opus-slate/20 px-6 py-10 text-center text-sm text-opus-warm/55">
            {t.indexEmpty}
          </p>
        ) : (
          <ul className={SHELF_GRID}>
            {shelves.map((shelf) => {
              const detailHref = withLocale(locale, `/curation/${shelf.id}`);
              const itemsLabel = t.itemsCount.replace("{n}", String(shelf.itemCount));
              return (
                <li key={shelf.id}>
                  <Link
                    href={detailHref}
                    className="group block overflow-hidden rounded-lg border border-white/[0.08] bg-gradient-to-b from-opus-slate/30 to-[#161616] p-6 shadow-opus-card transition hover:border-opus-gold/38 md:p-8"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="opus-text-metallic font-display text-xl tracking-wide md:text-2xl">
                          {shelf.title[locale]}
                        </h2>
                        <p className="mt-3 line-clamp-3 text-sm text-opus-warm/55">
                          {shelf.description[locale]}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full border border-white/[0.12] px-3 py-1 font-mono text-[0.6rem] uppercase tracking-[0.22em] text-opus-warm/65">
                        {itemsLabel}
                      </span>
                    </div>

                    <ul className={PREVIEW_GRID} aria-hidden>
                      {shelf.items.map((item) => (
                        <li
                          key={item.file}
                          className="relative aspect-[4/5] overflow-hidden rounded-md border border-white/[0.06] bg-gradient-to-b from-[#1f1f1f] to-opus-charcoal"
                        >
                          <Image
                            src={catalogImageSrcFromFile(item.file, "thumb")}
                            alt=""
                            fill
                            sizes="(min-width: 1024px) 130px, (min-width: 640px) 22vw, 45vw"
                            unoptimized
                            className="object-cover opacity-90 transition duration-500 group-hover:opacity-100"
                          />
                        </li>
                      ))}
                    </ul>

                    <p className="mt-6 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-opus-gold/85 group-hover:text-opus-gold-light">
                      {t.viewShelf} →
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
