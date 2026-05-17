import { ConsoleChrome } from "@/components/ConsoleChrome";
import {
  CONSOLE_LIST_PAGE_SIZE,
  ConsoleListPagination,
} from "@/components/ConsoleListPagination";
import { ConsoleMembersTable } from "@/components/ConsoleMembersTable";
import { ConsoleStatsPageShell } from "@/components/ConsoleStatsPageShell";
import { devPreviewMemberRows } from "@/lib/devPreviewMembers";
import { loadConsoleStatsPage } from "@/lib/loadConsoleStatsPage";
import { fetchMembersForOperator } from "@/lib/webInternal";

function parsePage(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export default async function ConsoleMembersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { locale, preview, chromeUser, t, actingUserId } = await loadConsoleStatsPage(params);
  const sp = await searchParams;
  const m = t.members;
  const page = parsePage(sp.page);
  const q = sp.q?.trim() ?? "";

  let rows = devPreviewMemberRows();
  let total = rows.length;
  let totalPages = 1;
  let currentPage = page;
  let loadError: string | null = null;

  if (preview) {
    const needle = q.toLowerCase();
    const filtered = needle
      ? rows.filter((r) =>
          [r.id, r.name, r.email, r.role].some((x) => x.toLowerCase().includes(needle)),
        )
      : rows;
    total = filtered.length;
    totalPages = Math.max(1, Math.ceil(total / CONSOLE_LIST_PAGE_SIZE));
    currentPage = Math.min(page, totalPages);
    const start = (currentPage - 1) * CONSOLE_LIST_PAGE_SIZE;
    rows = filtered.slice(start, start + CONSOLE_LIST_PAGE_SIZE);
  } else if (actingUserId) {
    try {
      const data = await fetchMembersForOperator(actingUserId, {
        page,
        pageSize: CONSOLE_LIST_PAGE_SIZE,
        q,
      });
      rows = data.users;
      total = data.total;
      totalPages = data.totalPages;
      currentPage = data.page;
    } catch {
      loadError = m.loadError;
      rows = [];
      total = 0;
      totalPages = 1;
      currentPage = 1;
    }
  }

  const basePath = `/${locale}/stats/members`;

  return (
    <ConsoleChrome user={chromeUser} previewMode={preview} locale={locale} labels={t.chrome} langLabels={t.lang}>
      <ConsoleStatsPageShell
        locale={locale}
        backLabel={m.backToDashboard}
        title={m.title}
        subtitle={m.subtitle}
        totalLine={loadError ? null : m.totalTpl.replace("{count}", String(total))}
        loadError={loadError}
      >
        <ConsoleMembersTable
          rows={rows}
          labels={m}
          locale={locale}
          basePath={basePath}
          searchQuery={q}
          rowNumberStart={(currentPage - 1) * CONSOLE_LIST_PAGE_SIZE + 1}
        />
        <ConsoleListPagination
          basePath={basePath}
          page={currentPage}
          totalPages={totalPages}
          total={total}
          q={q}
          labels={{
            prev: m.paginationPrev,
            next: m.paginationNext,
            pageOf: m.paginationPageOf,
          }}
        />
      </ConsoleStatsPageShell>
    </ConsoleChrome>
  );
}
