/** UI switch order matches apps/web: Japanese → Korean → English. */
export const locales = ["ja", "ko", "en"] as const;

export type Locale = (typeof locales)[number];

/** Product default (same as web `defaultLocale`). */
export const defaultLocale: Locale = "ko";

/** Middleware fallback when cookie + Accept-Language do not match (same as web). */
export const fallbackLocale: Locale = "en";

/** Same cookie name as the storefront so behavior matches across OPUS surfaces (host-scoped per browser). */
export const localeCookieName = "NEXT_LOCALE";

export function isSupportedLocale(value: string | undefined): value is Locale {
  return Boolean(value && (locales as readonly string[]).includes(value));
}
