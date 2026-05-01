/** Default locale path segment for storefront URLs that are not OAuth-error paths (must match apps/web `defaultLocale`). */
export const storefrontDefaultLocale = "ko";

/** Legacy alias — prefer storefrontDefaultLocale for paths aligned with the web app. */
export const defaultLocale = storefrontDefaultLocale;

export function storefrontOrigin(): string {
  return (process.env["OPUS_STORE_PUBLIC_ORIGIN"] ?? "https://app.opus-store.com").replace(/\/$/, "");
}
