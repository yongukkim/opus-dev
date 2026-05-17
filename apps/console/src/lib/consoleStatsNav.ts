import type { Locale } from "@/i18n/config";
import type { ConsoleMessages } from "@/i18n/types";

/** Hash targets on `/{locale}/home` — keep in sync with dashboard metric cards. */
export const CONSOLE_STATS_SECTION_ID = "console-stats";

/** Sidebar + dashboard KPI anchors (active drill-downs only). */
export const CONSOLE_STATS_NAV_KEYS = ["members", "artworks"] as const;

export type ConsoleStatsNavKey = (typeof CONSOLE_STATS_NAV_KEYS)[number];

export const CONSOLE_STATS_ANCHOR: Record<ConsoleStatsNavKey, string> = {
  members: "stats-members",
  artworks: "stats-artworks",
};

export const CONSOLE_STATS_ROUTE: Record<ConsoleStatsNavKey, string> = {
  members: "stats/members",
  artworks: "stats/artworks",
};

export type ConsoleStatsNavItem = {
  id: string;
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
  const defs: { key: ConsoleStatsNavKey; label: string }[] = [
    { key: "members", label: dashboard.statsMembersTitle },
    { key: "artworks", label: dashboard.statsArtworksTitle },
  ];

  return {
    sectionHeading: dashboard.statsSectionHeading,
    items: defs.map(({ key, label }) => ({
      id: CONSOLE_STATS_ANCHOR[key],
      label,
      href: `/${locale}/${CONSOLE_STATS_ROUTE[key]}`,
    })),
  };
}
