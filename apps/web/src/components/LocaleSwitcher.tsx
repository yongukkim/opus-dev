"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { defaultLocale, locales, type Locale } from "@/i18n/config";
import { isLocale } from "@/i18n/paths";

/**
 * KO / EN / JA toggle (pattern: marketplace.aline.team header language control).
 * High-contrast labels so the control stays visible on near-black chrome.
 */
export function LocaleSwitcher({ ariaLabel }: { ariaLabel: string }) {
  const pathname = usePathname() ?? "/";
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0] ?? "";
  const current: Locale = isLocale(first) ? first : defaultLocale;
  const restSegments = isLocale(first) ? segments.slice(1) : segments;
  const rest = restSegments.length ? `/${restSegments.join("/")}` : "";

  const jaPage = current === "ja";

  return (
    <nav
      className={`relative z-[1] flex shrink-0 items-center gap-0.5 rounded-md border border-opus-gold/35 bg-opus-slate/60 px-0.5 py-0.5 shadow-[0_0_0_1px_rgba(0,0,0,0.35)] ${jaPage ? "[&_a]:tracking-tight" : ""}`}
      aria-label={ariaLabel}
    >
      {locales.map((loc) => {
        const href = `/${loc}${rest}`;
        const active = loc === current;
        return (
          <Link
            key={loc}
            href={href}
            hrefLang={loc === "ja" ? "ja" : loc === "ko" ? "ko" : "en"}
            className={`rounded px-2 py-1 font-sans text-[0.65rem] font-semibold transition md:px-2.5 md:text-[0.7rem] ${
              jaPage ? "" : "uppercase tracking-[0.12em] "
            }${
              active
                ? "bg-opus-gold/30 text-opus-gold-light"
                : "text-opus-warm/85 hover:bg-white/[0.08] hover:text-opus-warm"
            }`}
          >
            {loc === "ko" ? "KO" : loc === "ja" ? "JA" : "EN"}
          </Link>
        );
      })}
    </nav>
  );
}
