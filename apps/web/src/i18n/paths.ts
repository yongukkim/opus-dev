import type { Locale } from "./config";
import { defaultLocale, locales } from "./config";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function normalizeLocale(value: string): Locale {
  return isLocale(value) ? value : defaultLocale;
}

/** Prefix path with locale segment (`/ko`, `/ja/artworks`, …). */
export function withLocale(locale: Locale, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/") return `/${locale}`;
  return `/${locale}${normalized}`;
}
