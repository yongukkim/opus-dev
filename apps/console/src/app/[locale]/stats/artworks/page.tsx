import { ConsoleChrome } from "@/components/ConsoleChrome";
import { ConsoleSearchableTable, type ConsoleTableColumn } from "@/components/ConsoleSearchableTable";
import { ConsoleStatsPageShell } from "@/components/ConsoleStatsPageShell";
import { artworkReviewStatusLabel } from "@/lib/artworkReviewStatusLabel";
import { devPreviewArtworkRows } from "@/lib/devPreviewStatsLists";
import { formatConsoleDate } from "@/lib/formatConsoleDate";
import { loadConsoleStatsPage } from "@/lib/loadConsoleStatsPage";
import { fetchArtworksForOperator, type ConsoleArtworkRow } from "@/lib/webInternal";
import type { ConsoleMessages } from "@/i18n/types";

function editionLabel(row: ConsoleArtworkRow): string {
  if (row.editionMode === "unique") return "1/1";
  return `${row.editionTotal} max`;
}

function artworkColumns(labels: ConsoleMessages["artworks"], locale: string): ConsoleTableColumn<ConsoleArtworkRow>[] {
  return [
    {
      id: "title",
      header: labels.colTitle,
      searchValue: (r) => `${r.artworkTitle} ${r.nickname} ${r.id} ${r.genre} ${r.artistId}`,
      cell: (r) => <span className="font-medium text-neutral-900">{r.artworkTitle || "—"}</span>,
    },
    {
      id: "pen",
      header: labels.colPenName,
      cell: (r) => <span className="text-neutral-700">{r.nickname || "—"}</span>,
    },
    {
      id: "genre",
      header: labels.colGenre,
      cell: (r) => <span className="text-neutral-700">{r.genre || "—"}</span>,
    },
    {
      id: "status",
      header: labels.colStatus,
      cell: (r) => <span className="text-neutral-700">{artworkReviewStatusLabel(labels, r.reviewStatus)}</span>,
    },
    {
      id: "edition",
      header: labels.colEdition,
      cell: (r) => <span className="text-neutral-600">{editionLabel(r)}</span>,
    },
    {
      id: "created",
      header: labels.colRegistered,
      cell: (r) => <span className="text-neutral-600">{formatConsoleDate(locale, r.createdAt)}</span>,
    },
    {
      id: "submission",
      header: labels.colSubmissionId,
      cell: (r) => <span className="font-mono text-xs text-neutral-500">{r.id}</span>,
    },
    {
      id: "artist",
      header: labels.colArtistId,
      cell: (r) => <span className="font-mono text-xs text-neutral-500">{r.artistId}</span>,
    },
  ];
}

export default async function ConsoleArtworksPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, preview, chromeUser, t, actingUserId } = await loadConsoleStatsPage(params);
  const labels = t.artworks;
  const back = t.members.backToDashboard;

  let rows = devPreviewArtworkRows();
  let total = rows.length;
  let loadError: string | null = null;

  if (!preview && actingUserId) {
    try {
      const data = await fetchArtworksForOperator(actingUserId);
      rows = data.artworks;
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
          columns={artworkColumns(labels, locale)}
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
