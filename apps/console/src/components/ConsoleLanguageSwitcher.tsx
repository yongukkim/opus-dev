"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { localeCookieName, locales, type Locale } from "@/i18n/config";
import type { ConsoleMessages } from "@/i18n/types";

function pathForLocale(pathname: string, nextLocale: Locale): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return `/${nextLocale}/`;
  if ((locales as readonly string[]).includes(parts[0] ?? "")) {
    parts[0] = nextLocale;
    return `/${parts.join("/")}`;
  }
  return `/${nextLocale}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

export function ConsoleLanguageSwitcher({
  locale,
  labels,
}: {
  locale: Locale;
  labels: ConsoleMessages["lang"];
}) {
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const querySuffix = query ? `?${query}` : "";

  function persistLocale(next: Locale) {
    if (typeof document === "undefined") return;
    document.cookie = `${localeCookieName}=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-gray-500">
      <span className="sr-only">Language</span>
      {locales.map((loc) => (
        <Link
          key={loc}
          href={`${pathForLocale(pathname, loc)}${querySuffix}`}
          onClick={() => persistLocale(loc)}
          className={
            loc === locale
              ? "font-semibold text-gray-900"
              : "text-blue-600 underline decoration-blue-400/60 underline-offset-2 hover:text-blue-800"
          }
          hrefLang={loc}
        >
          {labels[loc]}
        </Link>
      ))}
    </div>
  );
}
