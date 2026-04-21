"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  defaultLocale,
  localeCookieName,
  locales,
  type Locale,
} from "@/i18n/config";
import { isLocale } from "@/i18n/paths";

/**
 * ISO 27001 A.18.1.4 (§7 Privacy by Design)
 * KO: 언어 선택은 비식별 환경설정 쿠키로만 저장한다(개인정보 아님, 1년 유지).
 * JA: 言語選択は非識別な環境設定Cookieのみに保存する（PIIではない、1年保持）。
 * EN: Locale preference is a non-identifying preference cookie only (no PII, 1-year).
 */
function persistLocalePreference(locale: Locale): void {
  if (typeof document === "undefined") return;
  const oneYearSeconds = 60 * 60 * 24 * 365;
  const secureFlag =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; secure"
      : "";
  document.cookie = `${localeCookieName}=${locale}; path=/; max-age=${oneYearSeconds}; samesite=lax${secureFlag}`;
}

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
            onClick={() => persistLocalePreference(loc)}
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
