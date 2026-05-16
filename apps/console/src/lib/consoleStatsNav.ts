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

export type ConsoleStatsNavItem = {
  id: (typeof CONSOLE_STATS_ANCHOR)[keyof typeof CONSOLE_STATS_ANCHOR];
  label: string;
};

export function buildConsoleStatsNavItems(dashboard: ConsoleMessages["dashboard"]): {
  sectionHeading: string;
  items: ConsoleStatsNavItem[];
} {
  return {
    sectionHeading: dashboard.statsSectionHeading,
    items: [
      { id: CONSOLE_STATS_ANCHOR.members, label: dashboard.statsMembersTitle },
      { id: CONSOLE_STATS_ANCHOR.artists, label: dashboard.statsArtistsTitle },
      { id: CONSOLE_STATS_ANCHOR.artworks, label: dashboard.statsArtworksTitle },
      { id: CONSOLE_STATS_ANCHOR.auctions, label: dashboard.statsAuctionsTitle },
      { id: CONSOLE_STATS_ANCHOR.custodyFixed, label: dashboard.statsCustodyFixedTitle },
      { id: CONSOLE_STATS_ANCHOR.certificates, label: dashboard.statsCertificatesTitle },
    ],
  };
}
