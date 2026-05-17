import { ConsoleChrome } from "@/components/ConsoleChrome";
import { ConsoleCertificatesTable } from "@/components/ConsoleCertificatesTable";
import { CONSOLE_LIST_PAGE_SIZE, ConsoleListPagination } from "@/components/ConsoleListPagination";
import { ConsoleStatsPageShell } from "@/components/ConsoleStatsPageShell";
import { parseConsoleListSortOrder } from "@/lib/consoleListQuery";
import { groupCertificateRows, sortCertificateGroups } from "@/lib/consoleListSort";
import { devPreviewIssuedEditionRows } from "@/lib/devPreviewStatsLists";
import { loadConsoleStatsPage } from "@/lib/loadConsoleStatsPage";
import type { ConsoleIssuedEditionGroup } from "@/lib/webInternal";
import { fetchIssuedEditionsForOperator } from "@/lib/webInternal";

function parsePage(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function filterGroups(groups: ConsoleIssuedEditionGroup[], q: string): ConsoleIssuedEditionGroup[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return groups;
  return groups.filter((g) => {
    if (
      [g.artworkTitle, g.submissionId ?? "", g.linkStatus, `${g.issuedCount}/${g.editionTotal}`].some((x) =>
        x.toLowerCase().includes(needle),
      )
    ) {
      return true;
    }
    return g.editions.some((e) =>
      [e.editionId, e.ownerName ?? "", e.ownerEmail ?? "", `${e.editionNumber}/${e.editionTotal}`].some((x) =>
        x.toLowerCase().includes(needle),
      ),
    );
  });
}

export default async function ConsoleCertificatesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; q?: string; sort?: string; order?: string }>;
}) {
  const { locale, preview, chromeUser, t, actingUserId } = await loadConsoleStatsPage(params);
  const sp = await searchParams;
  const labels = t.certificates;
  const back = t.members.backToDashboard;
  const page = parsePage(sp.page);
  const q = sp.q?.trim() ?? "";
  const sort = sp.sort?.trim() || undefined;
  const order = parseConsoleListSortOrder(sp.order);

  let groups: ConsoleIssuedEditionGroup[] = groupCertificateRows(devPreviewIssuedEditionRows());
  let total = groups.length;
  let certificateTotal = groups.reduce((n, g) => n + g.issuedCount, 0);
  let totalPages = 1;
  let currentPage = page;
  let loadError: string | null = null;

  if (preview) {
    const filtered = filterGroups(groups, q);
    const sorted = sortCertificateGroups(filtered, sort, order);
    certificateTotal = sorted.reduce((n, g) => n + g.issuedCount, 0);
    total = sorted.length;
    totalPages = Math.max(1, Math.ceil(total / CONSOLE_LIST_PAGE_SIZE));
    currentPage = Math.min(page, totalPages);
    const start = (currentPage - 1) * CONSOLE_LIST_PAGE_SIZE;
    groups = sorted.slice(start, start + CONSOLE_LIST_PAGE_SIZE);
  } else if (actingUserId) {
    try {
      const data = await fetchIssuedEditionsForOperator(actingUserId, {
        page,
        pageSize: CONSOLE_LIST_PAGE_SIZE,
        q,
        sort,
        order,
      });
      groups = data.groups;
      total = data.total;
      certificateTotal = data.certificateTotal;
      totalPages = data.totalPages;
      currentPage = data.page;
    } catch {
      loadError = labels.loadError;
      groups = [];
      total = 0;
      certificateTotal = 0;
      totalPages = 1;
      currentPage = 1;
    }
  }

  const basePath = `/${locale}/stats/certificates`;
  const totalLine = loadError
    ? null
    : labels.totalTpl.replace("{artworks}", String(total)).replace("{certificates}", String(certificateTotal));

  return (
    <ConsoleChrome user={chromeUser} previewMode={preview} locale={locale} labels={t.chrome} langLabels={t.lang}>
      <ConsoleStatsPageShell
        locale={locale}
        backLabel={back}
        title={labels.title}
        subtitle={labels.subtitle}
        totalLine={totalLine}
        loadError={loadError}
      >
        <ConsoleCertificatesTable
          groups={groups}
          labels={labels}
          locale={locale}
          basePath={basePath}
          listQuery={{ q, sort, order }}
          rowNumberStart={(currentPage - 1) * CONSOLE_LIST_PAGE_SIZE + 1}
          previewMode={preview}
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
