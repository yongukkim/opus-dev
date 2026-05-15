import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/types";
import type { VaultUiRole } from "@/lib/vaultRole";
import { withLocale } from "@/i18n/paths";

/** Paths shown only when session artist + vault UI role artist (matches `VaultSidebar`). */
export const VAULT_ARTIST_ONLY_PATHS = ["/vault/submit", "/vault/my-artworks", "/vault/artist-profile"] as const;

/** Paths shown only for operator session (matches `VaultSidebar`). */
export const VAULT_OPERATOR_ONLY_PATHS = ["/vault/authority"] as const;

type VaultNavPath =
  | "/vault/collection"
  | "/vault/transfer/register"
  | "/vault/activity"
  | "/vault/submit"
  | "/vault/my-artworks"
  | "/vault/payouts"
  | "/vault/artist-profile"
  | "/vault/authority"
  | "/vault/settings";

/**
 * Vault sidebar / mobile drawer — same path set and visibility rules as `VaultSidebar`.
 */
export function getVaultNavItems(
  locale: Locale,
  m: Messages,
  opts: { sessionIsArtist: boolean; vaultRole: VaultUiRole; isOperator: boolean },
): { path: VaultNavPath; label: string; href: string }[] {
  const nav = m.vaultNav;
  const rows: { path: VaultNavPath; label: string }[] = [
    { path: "/vault/collection", label: nav.collection },
    { path: "/vault/transfer/register", label: nav.transferRegister },
    { path: "/vault/activity", label: nav.activity },
    { path: "/vault/submit", label: nav.submit },
    { path: "/vault/my-artworks", label: nav.myArtworks },
    { path: "/vault/payouts", label: nav.payouts },
    { path: "/vault/artist-profile", label: nav.artistProfile },
    { path: "/vault/authority", label: nav.authoritySettings },
    { path: "/vault/settings", label: nav.settings },
  ];

  const showArtistNav = opts.sessionIsArtist && opts.vaultRole === "artist";

  return rows
    .filter(({ path }) => {
      if (!showArtistNav && (VAULT_ARTIST_ONLY_PATHS as readonly string[]).includes(path)) {
        return false;
      }
      if (!opts.isOperator && (VAULT_OPERATOR_ONLY_PATHS as readonly string[]).includes(path)) {
        return false;
      }
      return true;
    })
    .map(({ path, label }) => ({ path, label, href: withLocale(locale, path) }));
}
