import { defaultLocale, isSupportedLocale, type Locale } from "@/i18n/config";

export function localeFromFormData(formData: FormData): Locale {
  const raw = String(formData.get("locale") ?? "");
  return isSupportedLocale(raw) ? raw : defaultLocale;
}
