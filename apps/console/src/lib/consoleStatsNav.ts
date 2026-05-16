import type { Locale } from "@/i18n/config";
import type { ConsoleMessages } from "@/i18n/types";

/** Hash targets on `/{locale}/home` — keep in sync with dashboard metric cards. */
export const CONSOLE_STATS_SECTION_ID = "console-stats";

export const CONSOLE_STATS_ANCHOR = {
  members: "stats-members",
  artists: "stats-artists",
  artworks: "stats-artworks",
  auctions: "stats-auctions",
  custodyFixed: "stats-custody-fixed",
  certificates: "stats-certificates",
} as const;

/** Dedicated console routes for aggregate drill-downs (null = home hash only). */
export const CONSOLE_STATS_ROUTE: Partial<Record<keyof typeof CONSOLE_STATS_ANCHOR, string>> = {
  members: "stats/members",
};

export type ConsoleStatsNavItem = {
  id: (typeof CONSOLE_STATS_ANCHOR)[keyof typeof CONSOLE_STATS_ANCHOR];
  label: string;
  href: string;
};

export function buildConsoleStatsNavItems(
  locale: Locale,
  dashboard: ConsoleMessages["dashboard"],
): {
  sectionHeading: string;
  items: ConsoleStatsNavItem[];
} {
  const home = `/${locale}/home`;
  const defs: { key: keyof typeof CONSOLE_STATS_ANCHOR; label: string }[] = [
    { key: "members", label: dashboard.statsMembersTitle },
    { key: "artists", label: dashboard.statsArtistsTitle },
    { key: "artworks", label: dashboard.statsArtworksTitle },
    { key: "auctions", label: dashboard.statsAuctionsTitle },
    { key: "custodyFixed", label: dashboard.statsCustodyFixedTitle },
    { key: "certificates", label: dashboard.statsCertificatesTitle },
  ];

  return {
    sectionHeading: dashboard.statsSectionHeading,
    items: defs.map(({ key, label }) => {
      const route = CONSOLE_STATS_ROUTE[key];
      const id = CONSOLE_STATS_ANCHOR[key];
      return {
        id,
        label,
        href: route ? `/${locale}/${route}` : `${home}#${id}`,
      };
    }),
  };
}
