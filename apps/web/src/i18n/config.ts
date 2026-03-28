/** UI switch order: Japanese → Korean → English (product default locale remains `defaultLocale`). */
export const locales = ["ja", "ko", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ko";

export const ogLocale: Record<Locale, string> = {
  ko: "ko_KR",
  en: "en_US",
  ja: "ja_JP",
};
