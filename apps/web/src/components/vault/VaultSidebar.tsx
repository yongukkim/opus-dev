"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/types";
import type { VaultUiRole } from "@/lib/vaultRole";
import { withLocale } from "@/i18n/paths";
import { VaultRoleDemoSwitch } from "./VaultRoleDemoSwitch";

/**
 * Account sidebar (pattern: Web_Template 2135_mini_finance dashboard nav).
 */
const ARTIST_ONLY_PATHS = [
  "/vault/submit",
  "/vault/my-artworks",
  "/vault/payouts",
  "/vault/artist-profile",
] as const;
const OPERATOR_ONLY_PATHS = ["/vault/authority"] as const;

export function VaultSidebar({
  locale,
  m,
  vaultRole,
  sessionIsArtist,
  isOperator,
}: {
  locale: Locale;
  m: Messages;
  vaultRole: VaultUiRole;
  /** DB / session role: artist registration complete. */
  sessionIsArtist: boolean;
  isOperator: boolean;
}) {
  const pathname = usePathname();
  const ja = locale === "ja";
  const nav = m.vaultNav;
  const vaultCopy = m.vault;
  const links = [
    { path: "/vault" as const, label: nav.overview },
    { path: "/vault/collection" as const, label: nav.collection },
    { path: "/vault/transfer/register" as const, label: nav.transferRegister },
    { path: "/vault/activity" as const, label: nav.activity },
    { path: "/vault/submit" as const, label: nav.submit },
    { path: "/vault/my-artworks" as const, label: nav.myArtworks },
    { path: "/vault/payouts" as const, label: nav.payouts },
    { path: "/vault/artist-profile" as const, label: nav.artistProfile },
    { path: "/vault/authority" as const, label: nav.authoritySettings },
    { path: "/vault/settings" as const, label: nav.settings },
  ]
    .filter(({ path }) => {
      const showArtistNav = sessionIsArtist && vaultRole === "artist";
      if (!showArtistNav && (ARTIST_ONLY_PATHS as readonly string[]).includes(path)) {
        return false;
      }
      if (!isOperator && (OPERATOR_ONLY_PATHS as readonly string[]).includes(path)) {
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
      {sessionIsArtist ? (
        <div className="border-t border-white/[0.08] px-3 pb-4 md:px-4">
          <VaultRoleDemoSwitch
            layout="embedded"
            currentRole={vaultRole}
            sectionTitle={vaultCopy.vaultModeSwitchTitle}
            labels={{ toArtist: vaultCopy.demoSwitchArtist, toCollector: vaultCopy.demoSwitchCollector }}
          />
        </div>
      ) : null}
    </aside>
  );
}
