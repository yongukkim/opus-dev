import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n/catalog";
import { normalizeLocale, withLocale } from "@/i18n/paths";
import { catalogImageSrcFromFile } from "@/lib/catalogImageUrl";
import { loadShelfById } from "@/lib/curationCatalog";

/**
 * `/[locale]/curation/[id]` — operator-curated shelf detail (PR-11).
 * Spec: docs/home-redesign-curation-rails-and-omnisearch.md §3.6 / §6 / §8.2.
 *
 * Renders every (catalog-resolved) item on a single shelf as a 4-column
 * grid identical in style to Rail D / the artist page, so that the
 * channel marker (PRIMARY) and card visuals stay consistent across
 * surfaces. Each card links to `/releases/<slug>` (the artwork PDP).
 *
 * `loadShelfById` returns `null` only when the shelf id is unknown; an
 * empty (but valid) shelf falls through to the `detailEmpty` copy so we
 * never render a half-rendered grid.
 */

type Props = { params: Promise<{ locale: string; id: string }> };

const WORK_GRID = "mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6";

export default async function CurationDetailPage({ params }: Props) {
  const { locale: raw, id } = await params;
  const locale = normalizeLocale(raw);
  const shelf = await loadShelfById(id);
  if (!shelf) notFound();

  const m = getDictionary(locale);
  const t = m.curation;

  const homeHref = withLocale(locale, "/");
  const indexHref = withLocale(locale, "/curation");
  const itemsLabel = t.itemsCount.replace("{n}", String(shelf.itemCount));

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
            <li>
              <Link href={indexHref} className="transition hover:text-opus-gold-light">
                {t.breadcrumbIndex}
              </Link>
            </li>
            <li className="text-opus-warm/25" aria-hidden>
              /
            </li>
            <li className="max-w-[min(100%,18rem)] truncate text-opus-warm/65 sm:max-w-md">
              {shelf.title[locale]}
            </li>
          </ol>
        </nav>

        <header className="mt-8 flex flex-col gap-3 border-t border-white/[0.06] pt-8 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="opus-text-metallic font-display text-3xl tracking-wide md:text-4xl">
              {shelf.title[locale]}
            </h1>
            <p className="mt-3 max-w-xl text-sm text-opus-warm/55">
              {shelf.description[locale]}
            </p>
          </div>
          <span className="shrink-0 self-start rounded-full border border-white/[0.12] px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-opus-warm/65 md:self-end">
            {itemsLabel}
          </span>
        </header>

        <section className="mt-12" aria-labelledby="curation-shelf-heading">
          <h2
            id="curation-shelf-heading"
            className="font-mono text-[0.65rem] uppercase tracking-[0.24em] text-opus-warm/45"
          >
            {t.worksHeading}
          </h2>
          <p className="mt-2 max-w-xl text-xs text-opus-warm/45">{t.worksLead}</p>

          {shelf.items.length === 0 ? (
            <p className="mt-8 rounded-lg border border-white/[0.06] bg-opus-slate/20 px-6 py-10 text-center text-sm text-opus-warm/55">
              {t.detailEmpty}
            </p>
          ) : (
            <ul className={WORK_GRID}>
              {shelf.items.map((item) => (
                <li key={item.file}>
                  <Link
                    href={withLocale(locale, `/releases/${item.slug}`)}
                    className="group block overflow-hidden rounded-lg border border-white/[0.08] bg-opus-slate/30 shadow-opus-card transition hover:border-opus-gold/38"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-b from-[#1f1f1f] to-opus-charcoal">
                      <Image
                        src={catalogImageSrcFromFile(item.file, "thumb")}
                        alt={`${item.title} — ${item.artist}`}
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
                      <p className="mt-1 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-opus-warm/45">
                        {item.artist}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="mt-16 border-t border-white/[0.06] pt-8">
          <Link
            href={indexHref}
            className="text-sm text-opus-gold/80 underline-offset-4 hover:text-opus-gold-light hover:underline"
          >
            ← {t.backToIndex}
          </Link>
        </div>
      </div>
    </main>
  );
}
