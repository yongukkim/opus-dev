import { getDictionary } from "@/i18n/catalog";
import { normalizeLocale, withLocale } from "@/i18n/paths";
import Link from "next/link";
import Image from "next/image";
import { readdir } from "node:fs/promises";
import path from "node:path";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
};

const TOTAL_EDITIONS = 50;
const PAGE_SIZE = 20;

function parsePage(value: string | undefined): number {
  if (value == null || value === "") return 1;
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

function artworksPath(locale: ReturnType<typeof normalizeLocale>, page: number): string {
  const base = withLocale(locale, "/artworks");
  if (page <= 1) return base;
  return `${base}?page=${page}`;
}

const FALLBACK = [
  "unsplash_01_HzI3vf8wUwE.jpg",
  "unsplash_02_H2Z8A4af4Zo.jpg",
  "unsplash_03_4MksxMVbRrA.jpg",
  "unsplash_04_h7EvXCadies.jpg",
  "unsplash_05_HI0GShPQegc.jpg",
  "unsplash_06_a5RK_uk5Ej0.jpg",
  "unsplash_07_RBqC7kQoMIg.jpg",
  "unsplash_08__sZ7R0C_xKY.jpg",
  "unsplash_09_QVRHf8Gc9Pk.jpg",
  "unsplash_10_zl8hQxXZCeI.jpg",
  "unsplash_11_aVFTleL-L0g.jpg",
  "unsplash_12_dPn-PAuwYss.jpg",
  "unsplash_13_dKB6EJFLUaA.jpg",
  "unsplash_14_UG2Vqz5Q000.jpg",
  "unsplash_15_nuRF1oaw-Pg.jpg",
  "unsplash_16_GB1sPyY2YpQ.jpg",
  "unsplash_17_Bqrr9yrKD1o.jpg",
  "unsplash_18_KC5btjnw0_s.jpg",
  "unsplash_19_DQpHtE5WY-U.jpg",
  "unsplash_20_4hYSTQkZMNQ.jpg",
] as const;

function stripExt(filename: string): string {
  return filename.replace(/\.[a-z0-9]+$/i, "");
}

function prettifyToken(value: string): string {
  return value
    .replace(/[_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseTitleArtist(file: string, idx: number): { title: string; artist: string } {
  const base = stripExt(file);

  // Preferred local naming: "Artist - Title.ext"
  if (base.includes(" - ")) {
    const [artistRaw = "", ...titleParts] = base.split(" - ");
    const artist = prettifyToken(artistRaw);
    const title = prettifyToken(titleParts.join(" - "));
    if (artist && title) return { title, artist };
  }

  // Secondary: "Artist_Title.ext" (first token as artist)
  if (base.includes("_")) {
    const [artistRaw = "", ...titleParts] = base.split("_");
    const artist = prettifyToken(artistRaw);
    const title = prettifyToken(titleParts.join(" "));
    if (artist && title) return { title, artist };
  }

  return { title: `Premiere ${idx + 1}`, artist: "Unknown" };
}

async function listLocalArtworks(): Promise<string[]> {
  const dir = path.join(process.cwd(), "public", "local-artworks");
  try {
    const files = await readdir(dir);
    return files
      .filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
      .sort((a, b) => a.localeCompare(b, "en", { numeric: true, sensitivity: "base" }));
  } catch {
    return [];
  }
}

export default async function ArtworksPage({ params, searchParams }: Props) {
  const { locale: raw } = await params;
  const { page: pageParam } = await searchParams;
  const locale = normalizeLocale(raw);
  const m = getDictionary(locale);
  const a = m.artworks;
  const local = await listLocalArtworks();
  const useLocal = local.length > 0;
  const files = useLocal ? local : [...FALLBACK];
  const base = useLocal ? "/local-artworks" : "/sample-artworks";

  const totalPages = Math.max(1, Math.ceil(files.length / PAGE_SIZE));
  const requestedPage = parsePage(pageParam);
  const currentPage = Math.min(requestedPage, totalPages);
  const offset = (currentPage - 1) * PAGE_SIZE;
  const pageFiles = files.slice(offset, offset + PAGE_SIZE);

  const pageOfLabel = a.paginationPageOf
    .replace("{current}", String(currentPage))
    .replace("{total}", String(totalPages));

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

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {pageFiles.map((file, idx) => (
            <li key={file}>
              {(() => {
                const globalIdx = offset + idx;
                const { title, artist } = parseTitleArtist(file, globalIdx);
                const edition = `${a.editionLabel} ${globalIdx + 1}/${TOTAL_EDITIONS}`;
                const checkoutPath = `${withLocale(locale, "/checkout")}?artwork=${encodeURIComponent(
                  title,
                )}&returnTo=${encodeURIComponent(withLocale(locale, "/vault"))}`;
                const loginPath = `${withLocale(locale, "/login")}?returnTo=${encodeURIComponent(checkoutPath)}`;
                return (
              <div className="overflow-hidden rounded-lg border border-white/[0.08] bg-opus-slate/30 shadow-opus-card">
                <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-b from-[#1f1f1f] to-opus-charcoal">
                  <Image
                    src={`${base}/${file}`}
                    alt={`${title} — ${artist}`}
                    fill
                    sizes="(min-width: 1024px) 240px, (min-width: 640px) 45vw, 90vw"
                    className="object-cover opacity-95"
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
                </div>
                <div className="border-t border-white/[0.06] px-4 py-4">
                  <p className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
                    <span className="opus-text-metallic font-display text-sm tracking-wide">{title}</span>
                    <span className="font-display text-sm tracking-wide text-opus-warm/55">{artist}</span>
                  </p>
                  <p className="mt-1 font-mono text-[0.65rem] text-opus-warm/45">{edition}</p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <Link
                      href={loginPath}
                      className="opus-surface-metallic inline-flex shrink-0 items-center justify-center rounded-full px-5 py-2 text-[0.72rem] font-semibold tracking-[0.12em] text-black transition hover:opacity-95"
                    >
                      {a.buyCta}
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

        {totalPages > 1 ? (
          <nav
            className="mt-10 flex flex-wrap items-center justify-center gap-4 border-t border-white/[0.06] pt-10"
            aria-label={pageOfLabel}
          >
            {currentPage > 1 ? (
              <Link
                href={artworksPath(locale, currentPage - 1)}
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
                href={artworksPath(locale, currentPage + 1)}
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
