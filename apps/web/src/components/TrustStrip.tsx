import Link from "next/link";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/types";
import { withLocale } from "@/i18n/paths";
import { getSiteHeaderMobileNavItems } from "@/lib/siteHeaderMobileNavItems";
import { getVaultUiRoleFromCookies } from "@/lib/vaultRole";
import { SiteHeaderMobileNav } from "./SiteHeaderMobileNav";

/**
 * Secondary trust / utility bar (pattern: Web_Template finance-business sub-header).
 * Mobile: hamburger at the strip’s left edge; tagline + My Page follow (My Page stays trailing).
 */
export async function TrustStrip({ locale, m }: { locale: Locale; m: Messages }) {
  const ja = locale === "ja";
  const session = await auth();
  const isArtist = session?.user?.role === "artist";
  const isOperator = session?.user?.role === "operator";
  const vaultRole = getVaultUiRoleFromCookies(await cookies());
  const vaultHref = withLocale(locale, "/vault/collection");
  const linkClass = `whitespace-nowrap font-sans text-[0.65rem] text-opus-warm/50 transition hover:text-opus-gold md:text-xs ${ja ? "tracking-tight break-keep hover:font-medium" : ""}`;

  const mobileNavItems = getSiteHeaderMobileNavItems(locale, m, {
    sessionIsArtist: isArtist,
    vaultRole,
    isOperator,
  });

  return (
    <div
      className="fixed inset-x-0 top-[var(--opus-site-header-height)] z-40 border-b border-white/[0.07] bg-opus-charcoal/78 backdrop-blur-md"
      role="navigation"
      aria-label={m.a11y.trustStripNav}
    >
      <div className="mx-auto flex h-[var(--opus-trust-strip-height)] max-w-6xl items-center justify-between gap-3 px-6 md:px-10">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 md:gap-4">
          <div className="shrink-0 md:hidden">
            <SiteHeaderMobileNav
              items={mobileNavItems}
              menuLabel={m.a11y.primaryNav}
              openLabel={m.a11y.openMenu}
              closeLabel={m.a11y.closeMenu}
              ja={ja}
            />
          </div>
          <p
            className={`hidden min-w-0 flex-1 font-sans text-[0.6rem] leading-snug text-opus-warm/42 sm:block sm:max-w-[14rem] md:max-w-none md:text-[0.65rem] ${ja ? "tracking-tight break-keep" : ""}`}
          >
            <span className="opus-text-metallic-soft font-mono uppercase tracking-[0.18em]">Classic Luxury</span>
            <span className="mx-1.5 text-opus-warm/25">·</span>
            <span className="text-opus-warm/45">{m.trust.line}</span>
          </p>
        </div>
        <Link href={vaultHref} className={`shrink-0 ${linkClass}`}>
          {m.trust.vaultShort}
        </Link>
      </div>
    </div>
  );
}
