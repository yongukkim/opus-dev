"use client";

import { useMemo } from "react";
import { ConsoleSortableTh } from "@/components/ConsoleSortableTh";
import type { ConsoleMessages } from "@/i18n/types";
import type { ConsoleListQueryParams } from "@/lib/consoleListQuery";
import type { ConsoleIssuedEditionRow } from "@/lib/webInternal";

export function ConsoleCertificatesTable({
  rows,
  labels,
  locale,
  basePath,
  listQuery,
  rowNumberStart,
}: {
  rows: ConsoleIssuedEditionRow[];
  labels: ConsoleMessages["certificates"];
  locale: string;
  basePath: string;
  listQuery: ConsoleListQueryParams;
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

  const colSpan = 6;

  return (
    <div className="space-y-4">
        <form method="get" action={basePath} className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
          <label
            htmlFor="certificates-q"
            className="block font-mono text-[0.65rem] font-medium uppercase tracking-[0.22em] text-neutral-500"
          >
            {labels.searchLabel}
          </label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              id="certificates-q"
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
          <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-xs font-medium uppercase tracking-wide text-neutral-600">
                <th className="w-14 px-3 py-3 text-center">{labels.colNo}</th>
                <ConsoleSortableTh basePath={basePath} column="title" label={labels.colTitle} listQuery={listQuery} />
                <ConsoleSortableTh basePath={basePath} column="edition" label={labels.colEdition} listQuery={listQuery} />
                <ConsoleSortableTh basePath={basePath} column="minted" label={labels.colMinted} listQuery={listQuery} />
                <ConsoleSortableTh basePath={basePath} column="editionId" label={labels.colEditionId} listQuery={listQuery} />
                <ConsoleSortableTh
                  basePath={basePath}
                  column="submission"
                  label={labels.colSubmissionId}
                  listQuery={listQuery}
                />
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
                  <tr key={row.editionId} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/80">
                    <td className="px-3 py-3 text-center font-mono text-xs tabular-nums text-neutral-500">
                      {rowNumberStart + index}
                    </td>
                    <td className="px-4 py-3 font-medium text-neutral-900">{row.artworkTitle || "—"}</td>
                    <td className="px-4 py-3 tabular-nums text-neutral-700">
                      {row.editionNumber}/{row.editionTotal}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {row.mintedAt ? dateFmt.format(new Date(row.mintedAt)) : "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-500">{row.editionId}</td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-500">{row.submissionId ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
    </div>
  );
}
