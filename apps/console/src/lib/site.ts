/** Default locale path segment when redirecting new accounts to the public storefront. */
export const defaultLocale = "en";

export function storefrontOrigin(): string {
  return (process.env["OPUS_STORE_PUBLIC_ORIGIN"] ?? "https://app.opus-store.com").replace(/\/$/, "");
}
