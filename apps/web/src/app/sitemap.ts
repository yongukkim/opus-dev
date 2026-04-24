import type { MetadataRoute } from "next";
import { locales, type Locale } from "@/i18n/config";
import { loadArtists } from "@/lib/artistsCatalog";
import { encodeArtworkSlug, loadCatalogFiles } from "@/lib/artworksCatalog";
import { loadShelves } from "@/lib/curationCatalog";

/**
 * Next.js native sitemap (PR-17 of the home-redesign series).
 *
 * Emits one `<url>` entry per (public route × locale) pair with hreflang
 * alternates, so search engines can negotiate per-visitor locale
 * correctly. The set of public routes is the union of:
 *
 *   Static:    /, /releases, /provenance, /curation, /featured-artists,
 *              /terms, /privacy, /legal/specified-commercial
 *   Dynamic:   /releases/[slug]       ← loadCatalogFiles
 *              /artist/[slug]         ← loadArtists (same selection rule
 *                                        used by Rail C, /featured-artists,
 *                                        and ⌘K)
 *              /curation/[id]         ← loadShelves, filtered by
 *                                        `itemCount > 0` so a dead shelf
 *                                        never lands in the sitemap
 *                                        (same contract as ⌘K shelves).
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
 */

const SITE_URL = (
  process.env["NEXT_PUBLIC_SITE_URL"] ?? "http://localhost:3000"
).replace(/\/$/, "");

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
  { path: "/curation", changeFrequency: "weekly", priority: 0.8 },
  { path: "/featured-artists", changeFrequency: "weekly", priority: 0.8 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
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
  // Resolve public data in parallel. All three helpers are server-only
  // and already used elsewhere; they guarantee a pen-name-shaped
  // public surface.
  const [{ files }, artists, shelves] = await Promise.all([
    loadCatalogFiles(),
    loadArtists(),
    loadShelves(),
  ]);

  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.flatMap((s) =>
    buildEntries(s, now),
  );

  const releaseEntries: MetadataRoute.Sitemap = files.flatMap((file) =>
    buildEntries(
      {
        path: `/releases/${encodeArtworkSlug(file)}`,
        changeFrequency: "monthly",
        priority: 0.6,
      },
      now,
    ),
  );

  const artistEntries: MetadataRoute.Sitemap = artists.flatMap((a) =>
    buildEntries(
      {
        path: `/artist/${a.slug}`,
        changeFrequency: "monthly",
        priority: 0.6,
      },
      now,
    ),
  );

  // Mirror the omni-search contract (PR-14): shelves with zero
  // resolved items are excluded — an empty shelf is a dead-end.
  const shelfEntries: MetadataRoute.Sitemap = shelves
    .filter((s) => s.itemCount > 0)
    .flatMap((s) =>
      buildEntries(
        {
          path: `/curation/${encodeURIComponent(s.id)}`,
          changeFrequency: "monthly",
          priority: 0.6,
        },
        now,
      ),
    );

  return [...staticEntries, ...releaseEntries, ...artistEntries, ...shelfEntries];
}
