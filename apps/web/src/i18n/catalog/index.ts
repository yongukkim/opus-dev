import type { Locale } from "../config";
import { defaultLocale } from "../config";
import type { Messages } from "../types";
import { en } from "./en";
import { ja } from "./ja";
import { ko } from "./ko";

const catalogs: Record<Locale, Messages> = {
  ko,
  en,
  ja,
};

export function getDictionary(locale: Locale): Messages {
  return catalogs[locale] ?? catalogs[defaultLocale];
}
