import { stat } from "node:fs/promises";
import path from "node:path";
import type { MetadataRoute } from "next";
import { locales, type Locale } from "@/i18n/config";
import { loadArtists } from "@/lib/artistsCatalog";
import { encodeArtworkSlug, loadCatalogFiles } from "@/lib/artworksCatalog";
import {
  COLLECTOR_TRANSFER_LISTINGS_FILE,
  listOpenCollectorTransferListings,
} from "@/lib/collectorTransferListings";
import { LEDGER_FILES } from "@/lib/ledgerStores";
import { getPublicSiteUrl } from "@/lib/publicSiteUrl";

/**
 * Next.js native sitemap (PR-17 of the home-redesign series).
 *
 * Emits one `<url>` entry per (public route × locale) pair with hreflang
 * alternates, so search engines can negotiate per-visitor locale
 * correctly. The set of public routes is the union of:
 *
 *   Static:    /, /releases, /provenance, /chronicle, /curation, /featured-artists,
 *              /terms, /privacy, /legal/copyright, /legal/specified-commercial
 *   Dynamic:   /releases/[slug]       ← loadCatalogFiles
 *              /artist/[slug]         ← loadArtists (same selection rule
 *                                        used by Rail C, /featured-artists,
 *                                        and ⌘K)
 *              /curation/[id]         ← loadShelves, filtered by
 *                                        `itemCount > 0` so a dead shelf
 *                                        never lands in the sitemap
 *                                        (same contract as ⌘K shelves).
 *              /provenance/[id]       ← listOpenCollectorTransferListings
 *                                        (PR-18 detail cutover). Only
 *                                        open listings are indexed —
 *                                        closed/withdrawn ids drop out
 *                                        naturally, same as ⌘K.
 *
 * Intentionally excluded (auth-gated, transactional, or operator-only):
 *   /vault/*, /login, /signup, /artist-signup, /checkout/*, /purchase/*,
 *   /seller/*, /operator/*
 *
 * Base URL: reads `NEXT_PUBLIC_SITE_URL` (stripped of trailing slash).
 * For local dev / previews without the env set, falls back to
 * `http://localhost:3000` — Google will ignore a localhost sitemap, and
 * production deploys set the env, so this is safe for both worlds.
 *
 * Compliance: the sitemap touches only pen-name-derived and catalog-file
 * identifiers (same set already rendered on public pages); no PII (legal
 * names, emails, sellerIds, walletAddresses) reaches this module.
 *
 * lastModified (PR-22): dynamic URLs use catalog image `mtime` (per file)
 * where the route is backed by a physical file under
 * `public/local-artworks` or `public/sample-artworks` (see
 * `loadCatalogFiles`).
 * `/artist/[slug]` uses the max mtime across that artist's work files.
 * `/curation/[id]` uses the max of resolved item file mtimes plus
 * `src/data/curation.ts` (shelf copy + membership can change without an
 * image touch). `/provenance/[id]` uses the listing's `createdAt` ISO
 * (per-row truth in JSONL), falling back to the JSONL file mtime if the
 * timestamp is invalid. Static routes share a single lastModified =
 * max(all catalog file mtimes, `curation.ts`, `featured-artists.ts`) so
 * IA / operator data edits bump the aggregate "static" freshness without
 * fabricating per-path file stats for every marketing page.
 */

const SITE_URL = getPublicSiteUrl();

async function fileMtime(absPath: string): Promise<Date | null> {
  try {
    const s = await stat(absPath);
    return s.mtime;
  } catch {
    return null;
  }
}

function maxDate(dates: readonly (Date | null | undefined)[]): Date {
  const valid = dates.filter((d): d is Date => d != null && !Number.isNaN(d.getTime()));
  if (valid.length === 0) return new Date();
  return new Date(Math.max(...valid.map((d) => d.getTime())));
}

function catalogAbsPath(file: string, useLocal: boolean): string {
  return path.join(
    process.cwd(),
    "public",
    useLocal ? "local-artworks" : "sample-artworks",
    file,
  );
}

/** One `stat` per catalog filename — reused for releases, artists, shelves. */
async function buildCatalogMtimeMap(
  files: readonly string[],
  useLocal: boolean,
): Promise<Map<string, Date>> {
  const map = new Map<string, Date>();
  await Promise.all(
    files.map(async (f) => {
      const m = await fileMtime(catalogAbsPath(f, useLocal));
      if (m) map.set(f, m);
    }),
  );
  return map;
}

type RouteSpec = {
  /** Locale-less path beginning with `/`. The root home is `/`. */
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
};

const STATIC_ROUTES: readonly RouteSpec[] = [
  { path: "/", changeFrequency: "weekly", priority: 1.0 },
  { path: "/releases", changeFrequency: "weekly", priority: 0.8 },
  { path: "/provenance", changeFrequency: "weekly", priority: 0.8 },
  { path: "/chronicle", changeFrequency: "weekly", priority: 0.65 },
  { path: "/featured-artists", changeFrequency: "weekly", priority: 0.8 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  {
    path: "/legal/copyright",
    changeFrequency: "yearly",
    priority: 0.3,
  },
  {
    path: "/legal/specified-commercial",
    changeFrequency: "yearly",
    priority: 0.3,
  },
];

function localizedUrl(locale: Locale, path: string): string {
  // Home for a locale is `/<locale>` (no trailing slash); all other
  // paths prefix the locale segment as `/<locale><path>`.
  const suffix = path === "/" ? "" : path;
  return `${SITE_URL}/${locale}${suffix}`;
}

function buildEntries(spec: RouteSpec, lastModified: Date): MetadataRoute.Sitemap {
  return locales.map((locale) => ({
    url: localizedUrl(locale, spec.path),
    lastModified,
    changeFrequency: spec.changeFrequency,
    priority: spec.priority,
    alternates: {
      languages: Object.fromEntries(
        locales.map((l) => [l, localizedUrl(l, spec.path)] as const),
      ),
    },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Resolve public data in parallel. All four helpers are server-only
  // and already used elsewhere; they guarantee a pen-name-shaped
  // public surface (legal name stripped at the lib boundary — PII
  // never reaches the sitemap).
  const [{ files, useLocal }, artists, listings] = await Promise.all([
    loadCatalogFiles(),
    loadArtists(),
    listOpenCollectorTransferListings(),
  ]);

  const [
    catalogMtimes,
    curationDataMtime,
    featuredDataMtime,
    jsonlMtime,
    chronicleLedgerMtime,
  ] = await Promise.all([
    buildCatalogMtimeMap(files, useLocal),
    fileMtime(path.join(process.cwd(), "src", "data", "curation.ts")),
    fileMtime(path.join(process.cwd(), "src", "data", "featured-artists.ts")),
    fileMtime(COLLECTOR_TRANSFER_LISTINGS_FILE),
    fileMtime(LEDGER_FILES.chronicleEntries),
  ]);

  const now = new Date();
  const maxCatalogMtime = maxDate([...catalogMtimes.values()]);
  const staticLastMod = maxDate([maxCatalogMtime, curationDataMtime, featuredDataMtime, chronicleLedgerMtime]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.flatMap((s) =>
    buildEntries(s, staticLastMod),
  );

  const releaseEntries: MetadataRoute.Sitemap = files.flatMap((file) => {
    const lastModified = catalogMtimes.get(file) ?? now;
    return buildEntries(
      {
        path: `/releases/${encodeArtworkSlug(file)}`,
        changeFrequency: "monthly",
        priority: 0.6,
      },
      lastModified,
    );
  });

  const artistEntries: MetadataRoute.Sitemap = artists.flatMap((a) => {
    const lastModified = maxDate(
      a.works.map((w) => catalogMtimes.get(w.file)),
    );
    return buildEntries(
      {
        path: `/artist/${a.slug}`,
        changeFrequency: "monthly",
        priority: 0.6,
      },
      lastModified,
    );
  });

  const listingEntries: MetadataRoute.Sitemap = listings.flatMap((r) => {
    const fromIso = new Date(r.createdAt);
    const lastModified = Number.isNaN(fromIso.getTime())
      ? (jsonlMtime ?? now)
      : fromIso;
    return buildEntries(
      {
        path: `/provenance/${encodeURIComponent(r.id)}`,
        changeFrequency: "daily",
        priority: 0.5,
      },
      lastModified,
    );
  });

  return [
    ...staticEntries,
    ...releaseEntries,
    ...artistEntries,
    ...listingEntries,
  ];
}
