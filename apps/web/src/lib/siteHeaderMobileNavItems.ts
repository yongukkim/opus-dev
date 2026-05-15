import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/types";
import { withLocale } from "@/i18n/paths";
import type { SiteHeaderNavItem } from "@/components/SiteHeaderMobileNav";
import { getVaultNavItems } from "@/lib/vaultNavLinks";
import type { VaultUiRole } from "@/lib/vaultRole";

/** Primary mobile drawer links (same set as former `SiteHeader` second row). */
export function getSiteHeaderMobileNavItems(
  locale: Locale,
  m: Messages,
  opts: { sessionIsArtist: boolean; vaultRole: VaultUiRole; isOperator: boolean },
): SiteHeaderNavItem[] {
  const vaultMobileChildren = getVaultNavItems(locale, m, opts).map(({ href, label }) => ({ href, label }));

  return [
    { kind: "link", href: withLocale(locale, "/about"), label: m.nav.about },
    { kind: "link", href: withLocale(locale, "/releases"), label: m.nav.releases },
    { kind: "link", href: withLocale(locale, "/featured-artists"), label: m.nav.artists },
    { kind: "link", href: withLocale(locale, "/provenance?saleMode=fixed"), label: m.nav.provenanceOnSale },
    { kind: "link", href: withLocale(locale, "/provenance?saleMode=auction"), label: m.nav.provenanceAuctions },
    {
      kind: "vault",
      label: m.nav.vault,
      expandAria: `${m.nav.vault}. ${m.a11y.expandMyPageSubmenu}`,
      subNavAria: m.a11y.vaultMobileSubNav,
      children: vaultMobileChildren,
    },
  ];
}
