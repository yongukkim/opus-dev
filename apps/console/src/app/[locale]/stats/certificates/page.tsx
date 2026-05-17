import { ConsoleChrome } from "@/components/ConsoleChrome";
import { ConsoleSearchableTable, type ConsoleTableColumn } from "@/components/ConsoleSearchableTable";
import { ConsoleStatsPageShell } from "@/components/ConsoleStatsPageShell";
import type { ConsoleMessages } from "@/i18n/types";
import { devPreviewIssuedEditionRows } from "@/lib/devPreviewStatsLists";
import { formatConsoleDate } from "@/lib/formatConsoleDate";
import { loadConsoleStatsPage } from "@/lib/loadConsoleStatsPage";
import { fetchIssuedEditionsForOperator, type ConsoleIssuedEditionRow } from "@/lib/webInternal";

function certificateColumns(
  labels: ConsoleMessages["certificates"],
  locale: string,
): ConsoleTableColumn<ConsoleIssuedEditionRow>[] {
  return [
    {
      id: "title",
      header: labels.colTitle,
      searchValue: (r) =>
        `${r.artworkTitle} ${r.submissionId ?? ""} ${r.editionId} ${r.editionNumber}/${r.editionTotal}`,
      cell: (r) => <span className="font-medium text-neutral-900">{r.artworkTitle}</span>,
    },
    {
      id: "edition",
      header: labels.colEdition,
      cell: (r) => (
        <span className="tabular-nums text-neutral-700">
          {r.editionNumber}/{r.editionTotal}
        </span>
      ),
    },
    {
      id: "minted",
      header: labels.colMinted,
      cell: (r) => <span className="text-neutral-600">{formatConsoleDate(locale, r.mintedAt ?? "")}</span>,
    },
    {
      id: "editionId",
      header: labels.colEditionId,
      cell: (r) => <span className="font-mono text-xs text-neutral-500">{r.editionId}</span>,
    },
    {
      id: "submission",
      header: labels.colSubmissionId,
      cell: (r) => <span className="font-mono text-xs text-neutral-500">{r.submissionId ?? "—"}</span>,
    },
  ];
}

export default async function ConsoleCertificatesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, preview, chromeUser, t, actingUserId } = await loadConsoleStatsPage(params);
  const labels = t.certificates;
  const back = t.members.backToDashboard;

  let rows = devPreviewIssuedEditionRows();
  let total = rows.length;
  let loadError: string | null = null;

  if (!preview && actingUserId) {
    try {
      const data = await fetchIssuedEditionsForOperator(actingUserId);
      rows = data.editions;
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
          columns={certificateColumns(labels, locale)}
          rowKey={(r) => r.editionId}
          labels={{
            searchLabel: labels.searchLabel,
            searchPlaceholder: labels.searchPlaceholder,
            empty: labels.empty,
          }}
          minWidthClass="min-w-[52rem]"
        />
      </ConsoleStatsPageShell>
    </ConsoleChrome>
  );
}
