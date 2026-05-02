import { defaultLocale, isSupportedLocale, type Locale } from "../config";
import type { ConsoleMessages } from "../types";
import { en } from "./en";
import { ja } from "./ja";
import { ko } from "./ko";

const catalogs: Record<Locale, ConsoleMessages> = {
  ko,
  en,
  ja,
};

export function getDictionary(locale: string | undefined): ConsoleMessages {
  if (isSupportedLocale(locale)) {
    return catalogs[locale];
  }
  return catalogs[defaultLocale];
}
