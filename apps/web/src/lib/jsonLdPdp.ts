import type { Locale } from "@/i18n/config";
import { withLocale } from "@/i18n/paths";
import { catalogImageSrcFromFile } from "@/lib/catalogImageUrl";
import { getPublicSiteUrl } from "@/lib/publicSiteUrl";

/** Canonical absolute URL for a locale-prefixed path (no trailing slash on origin). */
export function absolutePageUrl(locale: Locale, path: string): string {
  return `${getPublicSiteUrl()}${withLocale(locale, path)}`;
}

function absoluteFromPath(path: string): string {
  return `${getPublicSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

const CTX = "https://schema.org" as const;

/**
 * `/releases/[slug]` — primary-edition artwork PDP. Pen name only; same
 * surface contract as the visible page.
 */
export function buildReleaseJsonLd(input: {
  locale: Locale;
  slug: string;
  title: string;
  artist: string;
  priceJpy: number;
  catalogFile: string;
}): Record<string, unknown> {
  const pageUrl = absolutePageUrl(input.locale, `/releases/${input.slug}`);
  const imageUrl = absoluteFromPath(
    catalogImageSrcFromFile(input.catalogFile, "preview"),
  );
  return {
    "@context": CTX,
    "@type": "VisualArtwork",
    "@id": pageUrl,
    url: pageUrl,
    name: input.title,
    image: imageUrl,
    creator: {
      "@type": "Person",
      name: input.artist,
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "JPY",
      price: input.priceJpy,
      url: pageUrl,
    },
  };
}

/**
 * `/artist/[slug]` — public artist (pen name) page. `image` is optional
 * when the artist has no resolved works.
 */
export function buildArtistJsonLd(input: {
  locale: Locale;
  slug: string;
  penName: string;
  firstWorkFile?: string;
}): Record<string, unknown> {
  const pageUrl = absolutePageUrl(input.locale, `/artist/${input.slug}`);
  if (input.firstWorkFile) {
    return {
      "@context": CTX,
      "@type": "Person",
      "@id": pageUrl,
      url: pageUrl,
      name: input.penName,
      image: absoluteFromPath(catalogImageSrcFromFile(input.firstWorkFile, "thumb")),
    };
  }
  return {
    "@context": CTX,
    "@type": "Person",
    "@id": pageUrl,
    url: pageUrl,
    name: input.penName,
  };
}

/**
 * `/curation/[id]` — operator shelf. Item list is capped to avoid huge
 * payloads; remaining items are still on the page for humans.
 */
export function buildCurationShelfJsonLd(input: {
  locale: Locale;
  id: string;
  name: string;
  description: string;
  items: readonly { name: string; pagePath: string }[];
}): Record<string, unknown> {
  const pageUrl = absolutePageUrl(
    input.locale,
    `/curation/${encodeURIComponent(input.id)}`,
  );
  const cap = 24;
  const slice = input.items.slice(0, cap);
  return {
    "@context": CTX,
    "@type": "CollectionPage",
    "@id": pageUrl,
    url: pageUrl,
    name: input.name,
    description: input.description,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: input.items.length,
      itemListElement: slice.map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "VisualArtwork",
          name: item.name,
          url: absolutePageUrl(input.locale, item.pagePath),
        },
      })),
    },
  };
}

/**
 * `/provenance/[id]` — custody-transfer listing. UGC (description, tags,
 * note) is intentionally excluded so JSON-LD never mirrors raw seller
 * text beyond the artwork title the page already shows in the `<title>`.
 */
export function buildProvenanceListingJsonLd(input: {
  locale: Locale;
  id: string;
  artworkTitle: string;
  artistPenName: string;
  priceJpy: number;
}): Record<string, unknown> {
  const pageUrl = absolutePageUrl(
    input.locale,
    `/provenance/${encodeURIComponent(input.id)}`,
  );
  return {
    "@context": CTX,
    "@type": "VisualArtwork",
    "@id": pageUrl,
    url: pageUrl,
    name: input.artworkTitle,
    creator: {
      "@type": "Person",
      name: input.artistPenName,
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "JPY",
      price: input.priceJpy,
      url: pageUrl,
    },
  };
}
