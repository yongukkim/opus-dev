"use client";

import { useMemo, useState, type ReactNode } from "react";

export type ConsoleTableColumn<T> = {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Included in client-side search (lowercased). */
  searchValue?: (row: T) => string;
  className?: string;
};

export function ConsoleSearchableTable<T>({
  rows,
  columns,
  rowKey,
  labels,
  minWidthClass = "min-w-[56rem]",
}: {
  rows: T[];
  columns: ConsoleTableColumn<T>[];
  rowKey: (row: T, index: number) => string;
  labels: {
    searchLabel: string;
    searchPlaceholder: string;
    empty: string;
  };
  minWidthClass?: string;
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) =>
      columns.some((col) => {
        const v = col.searchValue?.(row);
        return v != null && v.toLowerCase().includes(needle);
      }),
    );
  }, [columns, q, rows]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
        <label className="block font-mono text-[0.65rem] font-medium uppercase tracking-[0.22em] text-neutral-500">
          {labels.searchLabel}
        </label>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={labels.searchPlaceholder}
          className="mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-[#DEB892] focus:ring-1 focus:ring-[#DEB892]/40"
        />
      </div>

      <div className={`overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm`}>
        <table className={`w-full ${minWidthClass} border-collapse text-left text-sm`}>
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-xs font-medium uppercase tracking-wide text-neutral-600">
              {columns.map((col) => (
                <th key={col.id} className={`px-4 py-3 ${col.className ?? ""}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-neutral-500">
                  {labels.empty}
                </td>
              </tr>
            ) : (
              filtered.map((row, index) => (
                <tr
                  key={rowKey(row, index)}
                  className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/80"
                >
                  {columns.map((col) => (
                    <td key={col.id} className={`px-4 py-3 ${col.className ?? ""}`}>
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
