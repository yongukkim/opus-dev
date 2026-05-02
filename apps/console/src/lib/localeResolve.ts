import type { NextRequest } from "next/server";
import { fallbackLocale, localeCookieName, locales, type Locale } from "@/i18n/config";

type LocaleSource = "cookie" | "header" | "fallback";

function parseAcceptLanguage(header: string): string[] {
  return header
    .split(",")
    .map((part) => {
      const [rawLang, ...params] = part.trim().split(";");
      let q = 1;
      for (const param of params) {
        const [key, value] = param.split("=");
        if (key?.trim() === "q" && value) {
          const parsed = Number.parseFloat(value);
          if (!Number.isNaN(parsed)) q = parsed;
        }
      }
      return { lang: rawLang?.trim().toLowerCase() ?? "", q };
    })
    .filter(({ lang }) => lang.length > 0)
    .sort((a, b) => b.q - a.q)
    .map(({ lang }) => lang);
}

function matchLocaleFromLanguages(languages: string[]): Locale | null {
  for (const lang of languages) {
    const primary = lang.split("-")[0];
    if (primary && (locales as readonly string[]).includes(primary)) {
      return primary as Locale;
    }
  }
  return null;
}

export function resolveLocale(req: NextRequest): { locale: Locale; source: LocaleSource } {
  const cookieValue = req.cookies.get(localeCookieName)?.value;
  if (cookieValue && (locales as readonly string[]).includes(cookieValue)) {
    return { locale: cookieValue as Locale, source: "cookie" };
  }
  const header = req.headers.get("accept-language");
  if (header) {
    const matched = matchLocaleFromLanguages(parseAcceptLanguage(header));
    if (matched) return { locale: matched, source: "header" };
  }
  return { locale: fallbackLocale, source: "fallback" };
}

export function localeFromPath(pathname: string): Locale | null {
  const seg = pathname.split("/")[1];
  if (seg && (locales as readonly string[]).includes(seg)) {
    return seg as Locale;
  }
  return null;
}

export function pathAfterLocale(pathname: string, locale: Locale): string {
  const prefix = `/${locale}`;
  if (pathname === prefix) return "/";
  if (pathname.startsWith(`${prefix}/`)) return pathname.slice(prefix.length);
  return pathname;
}

