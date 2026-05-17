import { ConsoleChrome } from "@/components/ConsoleChrome";
import { ConsoleSearchableTable, type ConsoleTableColumn } from "@/components/ConsoleSearchableTable";
import { ConsoleStatsPageShell } from "@/components/ConsoleStatsPageShell";
import type { ConsoleMessages } from "@/i18n/types";
import { devPreviewArtistRows } from "@/lib/devPreviewStatsLists";
import { formatConsoleDate } from "@/lib/formatConsoleDate";
import { loadConsoleStatsPage } from "@/lib/loadConsoleStatsPage";
import { fetchUsersForOperator, type ConsoleMemberRow } from "@/lib/webInternal";

function artistColumns(labels: ConsoleMessages["artists"], locale: string): ConsoleTableColumn<ConsoleMemberRow>[] {
  return [
    {
      id: "name",
      header: labels.colName,
      searchValue: (r) => `${r.name} ${r.email} ${r.id}`,
      cell: (r) => <span className="font-medium text-neutral-900">{r.name || "—"}</span>,
    },
    {
      id: "email",
      header: labels.colEmail,
      cell: (r) => <span className="text-neutral-700">{r.email || "—"}</span>,
    },
    {
      id: "created",
      header: labels.colCreated,
      cell: (r) => <span className="text-neutral-600">{formatConsoleDate(locale, r.createdAt)}</span>,
    },
    {
      id: "verified",
      header: labels.colVerified,
      cell: (r) => (
        <span className="text-neutral-600">{r.emailVerified ? labels.verifiedYes : labels.verifiedNo}</span>
      ),
    },
    {
      id: "id",
      header: labels.colUserId,
      cell: (r) => <span className="font-mono text-xs text-neutral-500">{r.id}</span>,
    },
  ];
}

export default async function ConsoleArtistsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, preview, chromeUser, t, actingUserId } = await loadConsoleStatsPage(params);
  const labels = t.artists;
  const back = t.members.backToDashboard;

  let rows = devPreviewArtistRows();
  let total = rows.length;
  let loadError: string | null = null;

  if (!preview && actingUserId) {
    try {
      const data = await fetchUsersForOperator(actingUserId, "artist");
      rows = data.users;
      total = data.total;
    } catch {
      loadError = labels.loadError;
      rows = [];
      total = 0;
    }
  }

  return (
    <ConsoleChrome user={chromeUser} previewMode={preview} locale={locale} labels={t.chrome} langLabels={t.lang}>
      <ConsoleStatsPageShell
        locale={locale}
        backLabel={back}
        title={labels.title}
        subtitle={labels.subtitle}
        totalLine={loadError ? null : labels.totalTpl.replace("{count}", String(total))}
        loadError={loadError}
      >
        <ConsoleSearchableTable
          rows={rows}
          columns={artistColumns(labels, locale)}
          rowKey={(r) => r.id}
          labels={{
            searchLabel: labels.searchLabel,
            searchPlaceholder: labels.searchPlaceholder,
            empty: labels.empty,
          }}
          minWidthClass="min-w-[48rem]"
        />
      </ConsoleStatsPageShell>
    </ConsoleChrome>
  );
}
