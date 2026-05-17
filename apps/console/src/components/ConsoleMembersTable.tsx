"use client";

import { useMemo } from "react";
import { ConsoleSortableTh } from "@/components/ConsoleSortableTh";
import type { ConsoleMessages } from "@/i18n/types";
import type { ConsoleListQueryParams } from "@/lib/consoleListQuery";
import type { ConsoleMemberRow } from "@/lib/webInternal";

function roleLabel(m: ConsoleMessages["members"], role: ConsoleMemberRow["role"]): string {
  if (role === "artist") return m.roleArtist;
  if (role === "operator") return m.roleOperator;
  return m.roleCollector;
}

export function ConsoleMembersTable({
  rows,
  labels,
  locale,
  basePath,
  listQuery,
  rowNumberStart,
}: {
  rows: ConsoleMemberRow[];
  labels: ConsoleMessages["members"];
  locale: string;
  basePath: string;
  listQuery: ConsoleListQueryParams;
  /** 1-based index for the first row on this page (pagination-aware). */
  rowNumberStart: number;
}) {
  const searchQuery = listQuery.q ?? "";
  const dateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    [locale],
  );

  const colSpan = 8;

  return (
    <div className="space-y-4">
      <form method="get" action={basePath} className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
        <label
          htmlFor="members-q"
          className="block font-mono text-[0.65rem] font-medium uppercase tracking-[0.22em] text-neutral-500"
        >
          {labels.searchLabel}
        </label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            id="members-q"
            name="q"
            type="search"
            defaultValue={searchQuery}
            placeholder={labels.searchPlaceholder}
            className="min-w-0 flex-1 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-[#DEB892] focus:ring-1 focus:ring-[#DEB892]/40"
          />
          {listQuery.sort ? <input type="hidden" name="sort" value={listQuery.sort} /> : null}
          {listQuery.order ? <input type="hidden" name="order" value={listQuery.order} /> : null}
          <button
            type="submit"
            className="rounded-md border border-[#DEB892]/50 bg-[#DEB892]/15 px-4 py-2 text-sm font-medium text-neutral-800 transition hover:bg-[#DEB892]/25"
          >
            {labels.searchLabel}
          </button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm">
        <table className="w-full min-w-[60rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-xs font-medium uppercase tracking-wide text-neutral-600">
              <th className="w-14 px-3 py-3 text-center">{labels.colNo}</th>
              <ConsoleSortableTh basePath={basePath} column="name" label={labels.colName} listQuery={listQuery} />
              <ConsoleSortableTh basePath={basePath} column="email" label={labels.colEmail} listQuery={listQuery} />
              <ConsoleSortableTh basePath={basePath} column="role" label={labels.colRole} listQuery={listQuery} />
              <ConsoleSortableTh
                basePath={basePath}
                column="artworkCount"
                label={labels.colArtworkCount}
                listQuery={listQuery}
                align="right"
                className="text-right"
              />
              <ConsoleSortableTh basePath={basePath} column="created" label={labels.colCreated} listQuery={listQuery} />
              <ConsoleSortableTh basePath={basePath} column="verified" label={labels.colVerified} listQuery={listQuery} />
              <ConsoleSortableTh basePath={basePath} column="id" label={labels.colUserId} listQuery={listQuery} />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-4 py-10 text-center text-neutral-500">
                  {labels.empty}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={row.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/80">
                  <td className="px-3 py-3 text-center font-mono text-xs tabular-nums text-neutral-500">
                    {rowNumberStart + index}
                  </td>
                  <td className="px-4 py-3 font-medium text-neutral-900">{row.name || "—"}</td>
                  <td className="px-4 py-3 text-neutral-700">{row.email || "—"}</td>
                  <td className="px-4 py-3 text-neutral-700">{roleLabel(labels, row.role)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-neutral-700">
                    {row.role === "artist" && row.artworkCount != null ? row.artworkCount : "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{dateFmt.format(new Date(row.createdAt))}</td>
                  <td className="px-4 py-3 text-neutral-600">
                    {row.emailVerified ? labels.verifiedYes : labels.verifiedNo}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-neutral-500">{row.id}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
