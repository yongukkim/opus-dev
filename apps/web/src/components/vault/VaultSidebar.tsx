"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/types";
import type { VaultUiRole } from "@/lib/vaultRole";
import { withLocale } from "@/i18n/paths";

/**
 * Account sidebar (pattern: Web_Template 2135_mini_finance dashboard nav).
 */
const ARTIST_ONLY_PATHS = [
  "/vault/submit",
  "/vault/my-artworks",
  "/vault/payouts",
  "/vault/artist-profile",
] as const;

export function VaultSidebar({
  locale,
  m,
  vaultRole,
}: {
  locale: Locale;
  m: Messages;
  vaultRole: VaultUiRole;
}) {
  const pathname = usePathname();
  const ja = locale === "ja";
  const v = m.vaultNav;
  const links = [
    { path: "/vault" as const, label: v.overview },
    { path: "/vault/collection" as const, label: v.collection },
    { path: "/vault/activity" as const, label: v.activity },
    { path: "/vault/submit" as const, label: v.submit },
    { path: "/vault/my-artworks" as const, label: v.myArtworks },
    { path: "/vault/payouts" as const, label: v.payouts },
    { path: "/vault/artist-profile" as const, label: v.artistProfile },
    { path: "/vault/settings" as const, label: v.settings },
  ]
    .filter(({ path }) => {
      if (vaultRole !== "artist" && (ARTIST_ONLY_PATHS as readonly string[]).includes(path)) {
        return false;
      }
      return true;
    })
    .map(({ path, label }) => ({ href: withLocale(locale, path), label }));

  function linkActive(href: string): boolean {
    const overviewHref = withLocale(locale, "/vault");
    if (href === overviewHref) {
      return pathname === overviewHref || pathname === `${overviewHref}/`;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside
      className="shrink-0 border-b border-white/[0.08] bg-opus-slate/20 md:w-56 md:border-b-0 md:border-r"
      aria-label={m.a11y.vaultNav}
    >
      <nav className="flex gap-1 overflow-x-auto p-3 md:flex-col md:overflow-visible md:p-4">
        {links.map(({ href, label }) => {
          const active = linkActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`whitespace-nowrap rounded-md px-3 py-2 font-sans text-xs transition md:px-3 ${
                ja ? "break-keep tracking-tight" : ""
              } ${
                active
                  ? ja
                    ? "bg-opus-gold/15 text-opus-gold font-medium"
                    : "bg-opus-gold/15 text-opus-gold"
                  : "text-opus-warm/55 hover:bg-white/[0.04] hover:text-opus-warm"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
