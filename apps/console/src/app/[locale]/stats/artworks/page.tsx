import { ConsoleChrome } from "@/components/ConsoleChrome";
import { ConsoleArtworksTable } from "@/components/ConsoleArtworksTable";
import { CONSOLE_LIST_PAGE_SIZE, ConsoleListPagination } from "@/components/ConsoleListPagination";
import { ConsoleStatsPageShell } from "@/components/ConsoleStatsPageShell";
import { parseConsoleListSortOrder } from "@/lib/consoleListQuery";
import { sortArtworkRows } from "@/lib/consoleListSort";
import { devPreviewArtworkRows } from "@/lib/devPreviewStatsLists";
import { loadConsoleStatsPage } from "@/lib/loadConsoleStatsPage";
import { fetchArtworksForOperator } from "@/lib/webInternal";

function parsePage(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export default async function ConsoleArtworksPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; q?: string; sort?: string; order?: string }>;
}) {
  const { locale, preview, chromeUser, t, actingUserId } = await loadConsoleStatsPage(params);
  const sp = await searchParams;
  const labels = t.artworks;
  const back = t.members.backToDashboard;
  const page = parsePage(sp.page);
  const q = sp.q?.trim() ?? "";
  const sort = sp.sort?.trim() || undefined;
  const order = parseConsoleListSortOrder(sp.order);

  let rows = devPreviewArtworkRows();
  let total = rows.length;
  let totalPages = 1;
  let currentPage = page;
  let loadError: string | null = null;

  if (preview) {
    const needle = q.toLowerCase();
    const filtered = needle
      ? rows.filter((r) =>
          [r.id, r.artworkTitle, r.nickname, r.genre, r.artistId, r.reviewStatus].some((x) =>
            x.toLowerCase().includes(needle),
          ),
        )
      : rows;
    const sorted = sortArtworkRows(filtered, sort, order);
    total = sorted.length;
    totalPages = Math.max(1, Math.ceil(total / CONSOLE_LIST_PAGE_SIZE));
    currentPage = Math.min(page, totalPages);
    const start = (currentPage - 1) * CONSOLE_LIST_PAGE_SIZE;
    rows = sorted.slice(start, start + CONSOLE_LIST_PAGE_SIZE);
  } else if (actingUserId) {
    try {
      const data = await fetchArtworksForOperator(actingUserId, {
        page,
        pageSize: CONSOLE_LIST_PAGE_SIZE,
        q,
        sort,
        order,
      });
      rows = data.artworks;
      total = data.total;
      totalPages = data.totalPages;
      currentPage = data.page;
    } catch {
      loadError = labels.loadError;
      rows = [];
      total = 0;
      totalPages = 1;
      currentPage = 1;
    }
  }

  const basePath = `/${locale}/stats/artworks`;

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
        <ConsoleArtworksTable
          rows={rows}
          labels={labels}
          locale={locale}
          basePath={basePath}
          listQuery={{ q, sort, order }}
          rowNumberStart={(currentPage - 1) * CONSOLE_LIST_PAGE_SIZE + 1}
        />
        <ConsoleListPagination
          basePath={basePath}
          page={currentPage}
          totalPages={totalPages}
          total={total}
          listQuery={{ q, sort, order }}
          labels={{
            prev: labels.paginationPrev,
            next: labels.paginationNext,
            pageOf: labels.paginationPageOf,
          }}
        />
      </ConsoleStatsPageShell>
    </ConsoleChrome>
  );
}
