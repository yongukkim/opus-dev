/** UI switch order: Japanese → Korean → English (product default locale remains `defaultLocale`). */
export const locales = ["ja", "ko", "en"] as const;

export type Locale = (typeof locales)[number];

/**
 * Product canonical locale.
 * Used for: SEO canonical, dictionary fallback, `og:locale`, and any place where
 * we want the "OPUS house" language rather than the visitor's inferred one.
 */
export const defaultLocale: Locale = "ko";

/**
 * Fallback used by middleware when *auto-detection* fails — i.e. the visitor has
 * no `NEXT_LOCALE` preference cookie and no `Accept-Language` header matches our
 * supported locales. English is the safest choice for unknown international
 * visitors. Kept separate from `defaultLocale` so we can tune auto-routing
 * behavior without touching SEO semantics.
 */
export const fallbackLocale: Locale = "en";

/** Persistence key for the visitor's locale preference. */
export const localeCookieName = "NEXT_LOCALE";

export const ogLocale: Record<Locale, string> = {
  ko: "ko_KR",
  en: "en_US",
  ja: "ja_JP",
};
