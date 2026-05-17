import type { Locale } from "@/i18n/config";
import type { ConsoleMessages } from "@/i18n/types";

/** Hash targets on `/{locale}/home` — keep in sync with dashboard metric cards. */
export const CONSOLE_STATS_SECTION_ID = "console-stats";

/** All dashboard KPI card anchors. */
export const CONSOLE_STATS_ANCHOR = {
  members: "stats-members",
  artists: "stats-artists",
  artworks: "stats-artworks",
  auctions: "stats-auctions",
  custodyFixed: "stats-custody-fixed",
  certificates: "stats-certificates",
} as const;

export type ConsoleStatsAnchorKey = keyof typeof CONSOLE_STATS_ANCHOR;

/** Left sidebar drill-downs only (dashboard still shows every KPI). */
export const CONSOLE_STATS_SIDEBAR_KEYS = ["members", "artworks"] as const satisfies readonly ConsoleStatsAnchorKey[];

export type ConsoleStatsSidebarKey = (typeof CONSOLE_STATS_SIDEBAR_KEYS)[number];

export const CONSOLE_STATS_ROUTE: Record<ConsoleStatsSidebarKey, string> = {
  members: "stats/members",
  artworks: "stats/artworks",
};

export type ConsoleStatsNavItem = {
  id: string;
  label: string;
  href: string;
};

const SIDEBAR_LABEL: Record<ConsoleStatsSidebarKey, (d: ConsoleMessages["dashboard"]) => string> = {
  members: (d) => d.statsMembersTitle,
  artworks: (d) => d.statsArtworksTitle,
};

export function buildConsoleStatsNavItems(
  locale: Locale,
  dashboard: ConsoleMessages["dashboard"],
): {
  sectionHeading: string;
  items: ConsoleStatsNavItem[];
} {
  return {
    sectionHeading: dashboard.statsSectionHeading,
    items: CONSOLE_STATS_SIDEBAR_KEYS.map((key) => ({
      id: CONSOLE_STATS_ANCHOR[key],
      label: SIDEBAR_LABEL[key](dashboard),
      href: `/${locale}/${CONSOLE_STATS_ROUTE[key]}`,
    })),
  };
}
