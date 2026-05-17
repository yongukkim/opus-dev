import Link from "next/link";
import {
  buildConsoleListQuery,
  nextConsoleListSort,
  sortIndicator,
  type ConsoleListQueryParams,
  type ConsoleListSortOrder,
} from "@/lib/consoleListQuery";

export function ConsoleSortableTh({
  basePath,
  column,
  label,
  listQuery,
  className = "",
  align = "left",
}: {
  basePath: string;
  column: string;
  label: string;
  listQuery: ConsoleListQueryParams;
  className?: string;
  align?: "left" | "right" | "center";
}) {
  const { sort: currentSort, order: currentOrder, q } = listQuery;
  const next = nextConsoleListSort(column, currentSort, currentOrder);
  const href = `${basePath}${buildConsoleListQuery({
    q,
    sort: next.sort,
    order: next.order,
    page: 1,
  })}`;
  const indicator = sortIndicator(column, currentSort, currentOrder);
  const alignClass =
    align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
  const active = currentSort === column;

  return (
    <th className={`px-4 py-3 ${alignClass} ${className}`}>
      <Link
        href={href}
        className={`inline-flex items-center gap-0.5 transition hover:text-neutral-900 ${active ? "text-neutral-900" : ""}`}
        title={label}
      >
        <span>{label}</span>
        <span className="font-mono text-[0.65rem] text-[#DEB892]" aria-hidden>
          {indicator}
        </span>
      </Link>
    </th>
  );
}

export type { ConsoleListSortOrder };
