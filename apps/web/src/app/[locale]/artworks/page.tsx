import { getDictionary } from "@/i18n/catalog";
import { normalizeLocale, withLocale } from "@/i18n/paths";
import { catalogImageSrcFromFile } from "@/lib/catalogImageUrl";
import {
  encodeArtworkSlug,
  loadCatalogFiles,
  PAGE_SIZE,
  parseTitleArtist,
  TOTAL_EDITIONS,
} from "@/lib/artworksCatalog";
import Image from "next/image";
import Link from "next/link";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; view?: string }>;
};

type CatalogView = "grid" | "list";

function parsePage(value: string | undefined): number {
  if (value == null || value === "") return 1;
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

function parseView(value: string | undefined): CatalogView {
  return value === "list" ? "list" : "grid";
}

function artworksHref(
  locale: ReturnType<typeof normalizeLocale>,
  page: number,
  view: CatalogView,
): string {
  const base = withLocale(locale, "/artworks");
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (view === "list") params.set("view", "list");
  const q = params.toString();
  return q ? `${base}?${q}` : base;
}

export default async function ArtworksPage({ params, searchParams }: Props) {
  const { locale: raw } = await params;
  const { page: pageParam, view: viewParam } = await searchParams;
  const locale = normalizeLocale(raw);
  const m = getDictionary(locale);
  const a = m.artworks;
  const { files, useLocal } = await loadCatalogFiles();

  const totalPages = Math.max(1, Math.ceil(files.length / PAGE_SIZE));
  const requestedPage = parsePage(pageParam);
  const currentPage = Math.min(requestedPage, totalPages);
  const offset = (currentPage - 1) * PAGE_SIZE;
  const pageFiles = files.slice(offset, offset + PAGE_SIZE);
  const view = parseView(viewParam);

  const pageOfLabel = a.paginationPageOf
    .replace("{current}", String(currentPage))
    .replace("{total}", String(totalPages));

  const toggleLinkClass = (active: boolean) =>
    `inline-flex min-w-[5.5rem] items-center justify-center rounded-full px-4 py-2 text-xs font-medium tracking-wide transition ${
      active
        ? "border border-opus-gold/45 bg-opus-gold/10 text-opus-gold-light shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
        : "border border-white/[0.1] text-opus-warm/55 hover:border-white/[0.18] hover:text-opus-warm/80"
    }`;

  return (
    <main className="min-h-screen bg-opus-charcoal px-6 pb-24 pt-[calc(6.5rem+4rem)] text-opus-warm/80">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="opus-text-metallic-soft text-sm uppercase tracking-[0.35em]">{a.kicker}</p>
          <h1 className="mt-4 font-display text-2xl text-opus-warm md:text-3xl">{a.title}</h1>
          <p className="mx-auto mt-4 max-w-md font-sans text-sm text-opus-warm/60">{a.body}</p>
          {useLocal ? (
            <p className="mx-auto mt-3 max-w-md text-xs text-opus-warm/45">
              Local preview mode: showing images from <span className="font-mono">public/local-artworks/</span>.
            </p>
          ) : null}
        </div>

        <nav
          className="mx-auto mt-10 flex max-w-md flex-wrap items-center justify-center gap-2"
          aria-label={a.viewToggleAria}
        >
          <Link
            href={artworksHref(locale, currentPage, "grid")}
            className={toggleLinkClass(view === "grid")}
            aria-current={view === "grid" ? "page" : undefined}
          >
            {a.viewGridLabel}
          </Link>
          <Link
            href={artworksHref(locale, currentPage, "list")}
            className={toggleLinkClass(view === "list")}
            aria-current={view === "list" ? "page" : undefined}
          >
            {a.viewListLabel}
          </Link>
        </nav>

        {view === "grid" ? (
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {pageFiles.map((file, idx) => (
              <li key={file}>
                {(() => {
                  const globalIdx = offset + idx;
                  const { title, artist } = parseTitleArtist(file, globalIdx);
                  const edition = `${a.editionLabel} ${globalIdx + 1}/${TOTAL_EDITIONS}`;
                  const detailHref = withLocale(locale, `/artworks/${encodeArtworkSlug(file)}`);
                  return (
                    <div className="overflow-hidden rounded-lg border border-white/[0.08] bg-opus-slate/30 shadow-opus-card">
                      <Link
                        href={detailHref}
                        className="relative block aspect-[4/5] overflow-hidden bg-gradient-to-b from-[#1f1f1f] to-opus-charcoal"
                      >
                        <Image
                          src={catalogImageSrcFromFile(file, "thumb")}
                          alt={`${title} — ${artist}`}
                          fill
                          sizes="(min-width: 1024px) 240px, (min-width: 640px) 45vw, 90vw"
                          unoptimized
                          className="object-cover opacity-95 transition hover:opacity-100"
                        />
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
                      </Link>
                      <div className="border-t border-white/[0.06] px-4 py-4">
                        <Link href={detailHref} className="block">
                          <p className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
                            <span className="opus-text-metallic font-display text-sm tracking-wide">{title}</span>
                            <span className="font-display text-sm tracking-wide text-opus-warm/55">{artist}</span>
                          </p>
                          <p className="mt-1 font-mono text-[0.65rem] text-opus-warm/45">{edition}</p>
                        </Link>
                        <div className="mt-4 flex items-center justify-between gap-3">
                          <Link
                            href={detailHref}
                            className="opus-surface-metallic inline-flex shrink-0 items-center justify-center rounded-full px-5 py-2 text-[0.72rem] font-semibold tracking-[0.12em] text-black transition hover:opacity-95"
                          >
                            {a.openWorkCta}
                          </Link>
                          <span className="text-right font-mono text-[0.65rem] uppercase tracking-[0.22em] text-opus-warm/35">
                            {a.buyHint}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </li>
            ))}
          </ul>
        ) : (
          <ul className="mt-10 divide-y divide-white/[0.08] rounded-lg border border-white/[0.08] bg-opus-slate/20">
            {pageFiles.map((file, idx) => (
              <li key={file}>
                {(() => {
                  const globalIdx = offset + idx;
                  const { title, artist } = parseTitleArtist(file, globalIdx);
                  const edition = `${a.editionLabel} ${globalIdx + 1}/${TOTAL_EDITIONS}`;
                  const detailHref = withLocale(locale, `/artworks/${encodeArtworkSlug(file)}`);
                  return (
                    <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-stretch sm:gap-5">
                      <Link
                        href={detailHref}
                        className="relative mx-auto aspect-[4/5] w-full max-w-[11rem] shrink-0 overflow-hidden rounded-md border border-white/[0.06] bg-gradient-to-b from-[#1f1f1f] to-opus-charcoal sm:mx-0 sm:max-w-none sm:w-36"
                      >
                        <Image
                          src={catalogImageSrcFromFile(file, "thumb")}
                          alt={`${title} — ${artist}`}
                          fill
                          sizes="(min-width: 640px) 144px, 100vw"
                          unoptimized
                          className="object-cover opacity-95 transition hover:opacity-100"
                        />
                      </Link>
                      <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                        <Link href={detailHref} className="min-w-0">
                          <p className="opus-text-metallic font-display text-sm tracking-wide">{title}</p>
                          <p className="mt-0.5 font-display text-sm text-opus-warm/55">{artist}</p>
                          <p className="mt-1 font-mono text-[0.65rem] text-opus-warm/45">{edition}</p>
                        </Link>
                        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 sm:flex-col sm:items-end">
                          <Link
                            href={detailHref}
                            className="opus-surface-metallic inline-flex items-center justify-center rounded-full px-5 py-2 text-[0.72rem] font-semibold tracking-[0.12em] text-black transition hover:opacity-95"
                          >
                            {a.openWorkCta}
                          </Link>
                          <span className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-opus-warm/35">
                            {a.buyHint}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </li>
            ))}
          </ul>
        )}

        {totalPages > 1 ? (
          <nav
            className="mt-10 flex flex-wrap items-center justify-center gap-4 border-t border-white/[0.06] pt-10"
            aria-label={pageOfLabel}
          >
            {currentPage > 1 ? (
              <Link
                href={artworksHref(locale, currentPage - 1, view)}
                rel="prev"
                className="rounded border border-white/[0.12] px-4 py-2 text-sm text-opus-warm/85 transition hover:border-opus-gold/40 hover:text-opus-gold-light"
              >
                {a.paginationPrev}
              </Link>
            ) : (
              <span className="rounded border border-transparent px-4 py-2 text-sm text-opus-warm/25">
                {a.paginationPrev}
              </span>
            )}
            <span className="font-mono text-sm text-opus-warm/55">{pageOfLabel}</span>
            {currentPage < totalPages ? (
              <Link
                href={artworksHref(locale, currentPage + 1, view)}
                rel="next"
                className="rounded border border-white/[0.12] px-4 py-2 text-sm text-opus-warm/85 transition hover:border-opus-gold/40 hover:text-opus-gold-light"
              >
                {a.paginationNext}
              </Link>
            ) : (
              <span className="rounded border border-transparent px-4 py-2 text-sm text-opus-warm/25">
                {a.paginationNext}
              </span>
            )}
          </nav>
        ) : null}

        <div className="mt-14 text-center">
          <Link
            href={withLocale(locale, "/")}
            className="inline-block text-sm text-opus-gold underline-offset-4 hover:text-opus-gold-light hover:underline"
          >
            {a.back}
          </Link>
        </div>
      </div>
    </main>
  );
}
