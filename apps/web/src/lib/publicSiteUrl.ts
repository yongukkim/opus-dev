/**
 * Absolute origin for public URLs (OG, JSON-LD, sitemap). Never append a
 * trailing slash — path segments come from `withLocale`.
 */
export function getPublicSiteUrl(): string {
  return (process.env["NEXT_PUBLIC_SITE_URL"] ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}
