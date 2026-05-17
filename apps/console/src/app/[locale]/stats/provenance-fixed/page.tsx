import { ConsoleChrome } from "@/components/ConsoleChrome";
import { ConsoleSearchableTable, type ConsoleTableColumn } from "@/components/ConsoleSearchableTable";
import { ConsoleStatsPageShell } from "@/components/ConsoleStatsPageShell";
import type { ConsoleMessages } from "@/i18n/types";
import { devPreviewProvenanceFixedRows } from "@/lib/devPreviewStatsLists";
import { formatConsoleDate } from "@/lib/formatConsoleDate";
import { formatJpy } from "@/lib/formatJpy";
import { loadConsoleStatsPage } from "@/lib/loadConsoleStatsPage";
import { fetchProvenanceListingsForOperator, type ConsoleProvenanceListingRow } from "@/lib/webInternal";

function fixedColumns(
  labels: ConsoleMessages["provenanceFixed"],
  locale: string,
): ConsoleTableColumn<ConsoleProvenanceListingRow>[] {
  return [
    {
      id: "title",
      header: labels.colTitle,
      searchValue: (r) =>
        `${r.artworkTitle} ${r.artistPenName} ${r.id} ${r.sellerId} ${r.sourceSubmissionId ?? ""}`,
      cell: (r) => <span className="font-medium text-neutral-900">{r.artworkTitle}</span>,
    },
    {
      id: "pen",
      header: labels.colPenName,
      cell: (r) => <span className="text-neutral-700">{r.artistPenName}</span>,
    },
    {
      id: "price",
      header: labels.colPrice,
      cell: (r) => <span className="tabular-nums text-neutral-700">{formatJpy(r.priceJpy)}</span>,
    },
    {
      id: "edition",
      header: labels.colEdition,
      cell: (r) => <span className="text-neutral-600">{r.editionRef}</span>,
    },
    {
      id: "listed",
      header: labels.colListed,
      cell: (r) => <span className="text-neutral-600">{formatConsoleDate(locale, r.createdAt)}</span>,
    },
    {
      id: "seller",
      header: labels.colSellerId,
      cell: (r) => <span className="font-mono text-xs text-neutral-500">{r.sellerId}</span>,
    },
    {
      id: "listing",
      header: labels.colListingId,
      cell: (r) => <span className="font-mono text-xs text-neutral-500">{r.id}</span>,
    },
    {
      id: "submission",
      header: labels.colSubmissionId,
      cell: (r) => <span className="font-mono text-xs text-neutral-500">{r.sourceSubmissionId ?? "—"}</span>,
    },
  ];
}

export default async function ConsoleProvenanceFixedPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, preview, chromeUser, t, actingUserId } = await loadConsoleStatsPage(params);
  const labels = t.provenanceFixed;
  const back = t.members.backToDashboard;

  let rows = devPreviewProvenanceFixedRows();
  let total = rows.length;
  let loadError: string | null = null;

  if (!preview && actingUserId) {
    try {
      const data = await fetchProvenanceListingsForOperator(actingUserId, "fixed");
      rows = data.listings;
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
          columns={fixedColumns(labels, locale)}
          rowKey={(r) => r.id}
          labels={{
            searchLabel: labels.searchLabel,
            searchPlaceholder: labels.searchPlaceholder,
            empty: labels.empty,
          }}
          minWidthClass="min-w-[64rem]"
        />
      </ConsoleStatsPageShell>
    </ConsoleChrome>
  );
}
