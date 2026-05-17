import Link from "next/link";
import { buildConsoleListQuery, type ConsoleListQueryParams } from "@/lib/consoleListQuery";

/** Default page size for operator console data tables (users, artworks, …). */
export const CONSOLE_LIST_PAGE_SIZE = 25;

/** @deprecated Use CONSOLE_LIST_PAGE_SIZE */
export const CONSOLE_MEMBERS_PAGE_SIZE = CONSOLE_LIST_PAGE_SIZE;

export { buildConsoleListQuery };

type PaginationLabels = {
  prev: string;
  next: string;
  pageOf: string;
};

export function ConsoleListPagination({
  basePath,
  page,
  totalPages,
  total,
  listQuery,
  labels,
}: {
  basePath: string;
  page: number;
  totalPages: number;
  total: number;
  listQuery: ConsoleListQueryParams;
  labels: PaginationLabels;
}) {
  if (totalPages <= 1) return null;

  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = page < totalPages ? page + 1 : null;
  const pageOf = labels.pageOf
    .replace("{page}", String(page))
    .replace("{totalPages}", String(totalPages))
    .replace("{total}", String(total));

  const linkClass =
    "rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:border-[#DEB892] hover:text-neutral-900 disabled:pointer-events-none disabled:opacity-40";
  const disabledClass =
    "rounded-md border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm font-medium text-neutral-400";

  return (
    <nav
      className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-4"
      aria-label={pageOf}
    >
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-neutral-500">{pageOf}</p>
      <div className="flex items-center gap-2">
        {prevPage ? (
          <Link href={`${basePath}${buildConsoleListQuery({ ...listQuery, page: prevPage })}`} className={linkClass}>
            {labels.prev}
          </Link>
        ) : (
          <span className={disabledClass}>{labels.prev}</span>
        )}
        {nextPage ? (
          <Link href={`${basePath}${buildConsoleListQuery({ ...listQuery, page: nextPage })}`} className={linkClass}>
            {labels.next}
          </Link>
        ) : (
          <span className={disabledClass}>{labels.next}</span>
        )}
      </div>
    </nav>
  );
}
