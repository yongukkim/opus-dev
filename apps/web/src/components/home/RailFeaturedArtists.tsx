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
import {
  FEATURED_ARTIST_PICKS,
  type FeaturedArtistPick,
} from "@/data/featured-artists";

/**
 * Rail C · Featured Artists — PR-6 of the home redesign series.
 * Spec: docs/home-redesign-curation-rails-and-omnisearch.md §3.5 / §6.
 *
 * Source of truth (phase 1):
 *   1. Group the public catalog by `parseTitleArtist(file).artist`
 *      (filename-derived; no submission record is ever read here).
 *   2. Keep any pen name with ≥ 2 surfaced works (spec §3.5).
 *   3. Merge in operator picks from `data/featured-artists.ts`, deduping by
 *      lowercased pen name. Picks take precedence in card order.
 *   4. Cap to four cards so vertical rhythm matches the other rails.
 *
 * PII (ISO 27001 A.18.1.4 / SECURITY_GOVERNANCE.md §1, spec §3.5):
 *   - The visible artist label is `penName` only (filename-derived or
 *     operator-set). No legal name, email, nationality, or internal user id
 *     reaches this component.
 *   - Each card's "view works" CTA temporarily points at the first
 *     representative artwork's PDP. Once `/artist/[slug]` ships in a
 *     follow-up PR (out of scope here), only that link string changes.
 */
const HOME_RAIL_LIMIT = 4;
const THUMBS_PER_CARD = 3;

type ArtistEntry = {
  /** Lowercased pen name; used purely for dedup keying. */
  key: string;
  penName: string;
  /** Filenames already filtered to ones present in the live catalog. */
  files: string[];
  /** Index of the first file inside the live catalog (for slug encoding). */
  firstGlobalIndex: number;
};

function groupCatalogByArtist(catalogFiles: readonly string[]): ArtistEntry[] {
  const map = new Map<string, ArtistEntry>();
  for (let i = 0; i < catalogFiles.length; i++) {
    const file = catalogFiles[i]!;
    const { artist } = parseTitleArtist(file, i);
    // "Unknown" is the explicit fallback parseTitleArtist returns for files
    // it can't infer an artist from; never surface it as a pen name on the
    // home page.
    if (!artist || artist === "Unknown") continue;
    const key = artist.toLowerCase();
    const prev = map.get(key);
    if (prev) {
      prev.files.push(file);
    } else {
      map.set(key, {
        key,
        penName: artist,
        files: [file],
        firstGlobalIndex: i,
      });
    }
  }
  // Spec §3.5: only pen names with ≥ 2 works qualify from grouping.
  return [...map.values()].filter((e) => e.files.length >= 2);
}

function mergeOperatorPicks(
  grouped: ArtistEntry[],
  picks: readonly FeaturedArtistPick[],
  catalogFiles: readonly string[],
): ArtistEntry[] {
  const indexByFile = new Map<string, number>();
  for (let i = 0; i < catalogFiles.length; i++) indexByFile.set(catalogFiles[i]!, i);

  const seen = new Set(grouped.map((e) => e.key));
  const out: ArtistEntry[] = [];
  for (const pick of picks) {
    const key = pick.penName.toLowerCase();
    if (seen.has(key)) continue;
    const validFiles = pick.artworkFiles.filter((f) => indexByFile.has(f));
    if (validFiles.length === 0) continue;
    seen.add(key);
    out.push({
      key,
      penName: pick.penName,
      files: [...validFiles],
      firstGlobalIndex: indexByFile.get(validFiles[0]!)!,
    });
  }
  // Operator picks come first so editorial intent leads grouping fallback.
  return [...out, ...grouped];
}

export async function RailFeaturedArtists({
  locale,
  m,
}: {
  locale: Locale;
  m: Messages;
}) {
  const r = m.home.railFeaturedArtists;
  const { files } = await loadCatalogFiles();
  const grouped = groupCatalogByArtist(files);
  const merged = mergeOperatorPicks(grouped, FEATURED_ARTIST_PICKS, files);
  const items = merged.slice(0, HOME_RAIL_LIMIT);

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
        </div>

        {items.length === 0 ? (
          <p className="mt-12 rounded-lg border border-white/[0.06] bg-opus-slate/20 px-6 py-10 text-center text-sm text-opus-warm/55">
            {r.empty}
          </p>
        ) : (
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {items.map((entry) => {
              const thumbs = entry.files.slice(0, THUMBS_PER_CARD);
              const firstSlug = encodeArtworkSlug(entry.files[0]!);
              const ctaHref = withLocale(locale, `/releases/${firstSlug}`);
              const worksLabel = r.worksCount.replace(
                "{n}",
                String(entry.files.length),
              );
              return (
                <li key={entry.key}>
                  <Link
                    href={ctaHref}
                    className="group flex h-full flex-col gap-4 overflow-hidden rounded-lg border border-white/[0.08] bg-gradient-to-b from-opus-slate/30 to-[#161616] p-5 shadow-opus-card transition hover:border-opus-gold/38"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="opus-text-metallic line-clamp-1 font-display text-base tracking-wide">
                        {entry.penName}
                      </p>
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
                      {thumbs.map((file) => (
                        <div
                          key={file}
                          className="relative aspect-square overflow-hidden rounded border border-white/[0.06] bg-gradient-to-b from-[#1f1f1f] to-opus-charcoal"
                        >
                          <Image
                            src={catalogImageSrcFromFile(file, "thumb")}
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
