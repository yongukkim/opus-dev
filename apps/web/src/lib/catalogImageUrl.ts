import { encodeArtworkSlug } from "@/lib/artworksCatalog";

export type CatalogImageVariant = "thumb" | "preview" | "vault";

/** Next.js Image `src` for catalog raster (served via `/api/catalog-image/*`, processed with sharp). */
export function catalogImageSrcFromFile(file: string, variant: CatalogImageVariant): string {
  const slug = encodeArtworkSlug(file);
  return `/api/catalog-image/${slug}/${variant}`;
}
