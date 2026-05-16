"use client";

import { useMemo, useState } from "react";
import type { ConsoleMessages } from "@/i18n/types";
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
}: {
  rows: ConsoleMemberRow[];
  labels: ConsoleMessages["members"];
  locale: string;
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) =>
      [r.id, r.name, r.email, r.role].some((x) => x.toLowerCase().includes(needle)),
    );
  }, [q, rows]);

  const dateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    [locale],
  );

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

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm">
        <table className="w-full min-w-[56rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-xs font-medium uppercase tracking-wide text-neutral-600">
              <th className="px-4 py-3">{labels.colName}</th>
              <th className="px-4 py-3">{labels.colEmail}</th>
              <th className="px-4 py-3">{labels.colRole}</th>
              <th className="px-4 py-3">{labels.colCreated}</th>
              <th className="px-4 py-3">{labels.colVerified}</th>
              <th className="px-4 py-3">{labels.colUserId}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-neutral-500">
                  {labels.empty}
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/80">
                  <td className="px-4 py-3 font-medium text-neutral-900">{row.name || "—"}</td>
                  <td className="px-4 py-3 text-neutral-700">{row.email || "—"}</td>
                  <td className="px-4 py-3 text-neutral-700">{roleLabel(labels, row.role)}</td>
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
