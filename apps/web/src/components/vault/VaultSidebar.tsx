"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/types";
import type { VaultUiRole } from "@/lib/vaultRole";
import { getVaultNavItems } from "@/lib/vaultNavLinks";
import { VaultRoleDemoSwitch } from "./VaultRoleDemoSwitch";

/**
 * Account sidebar (pattern: Web_Template 2135_mini_finance dashboard nav).
 */
export function VaultSidebar({
  locale,
  m,
  vaultRole,
  sessionIsArtist,
  isOperator,
  activityOperatorReviewNoticeCount,
}: {
  locale: Locale;
  m: Messages;
  vaultRole: VaultUiRole;
  /** DB / session role: artist registration complete. */
  sessionIsArtist: boolean;
  isOperator: boolean;
  /** Submissions with operator `reviewNote` in changes_requested / rejected (artist-held, JSONL). */
  activityOperatorReviewNoticeCount: number;
}) {
  const pathname = usePathname();
  const ja = locale === "ja";
  const nav = m.vaultNav;
  const vaultCopy = m.vault;
  const links = getVaultNavItems(locale, m, { sessionIsArtist, vaultRole, isOperator });

  function linkActive(href: string): boolean {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside
      className="shrink-0 border-b border-white/[0.08] bg-opus-slate/20 md:w-56 md:border-b-0 md:border-r"
      aria-label={m.a11y.vaultNav}
    >
      <nav className="flex gap-1 overflow-x-auto p-3 md:flex-col md:overflow-visible md:p-4">
        {links.map(({ path, href, label }) => {
          const active = linkActive(href);
          const showActivityReviewDot =
            path === "/vault/activity" &&
            sessionIsArtist &&
            activityOperatorReviewNoticeCount > 0;
          const activityAriaExtra = showActivityReviewDot
            ? ` — ${nav.activityReviewNoticeAria.replace("{count}", String(activityOperatorReviewNoticeCount))}`
            : "";
          return (
            <Link
              key={href}
              href={href}
              aria-label={showActivityReviewDot ? `${label}${activityAriaExtra}` : undefined}
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
              <span className="inline-flex items-center gap-1.5">
                <span>{label}</span>
                {showActivityReviewDot ? (
                  <span
                    aria-hidden
                    className="size-1.5 shrink-0 rounded-full bg-opus-gold shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
                    title={nav.activityReviewNoticeAria.replace("{count}", String(activityOperatorReviewNoticeCount))}
                  />
                ) : null}
              </span>
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
