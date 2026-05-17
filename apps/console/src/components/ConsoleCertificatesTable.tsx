"use client";

import { Fragment, useCallback, useMemo, useState } from "react";
import { ConsoleArtworkTitleHoverPreview } from "@/components/ConsoleArtworkTitleHoverPreview";
import { ConsoleSortableTh } from "@/components/ConsoleSortableTh";
import type { ConsoleMessages } from "@/i18n/types";
import type { ConsoleListQueryParams } from "@/lib/consoleListQuery";
import type { ConsoleIssuedEditionGroup, ConsoleIssuedEditionRow } from "@/lib/webInternal";

function ownerLabel(row: ConsoleIssuedEditionRow): string {
  if (row.ownerName?.trim()) return row.ownerName.trim();
  if (row.ownerEmail?.trim()) return row.ownerEmail.trim();
  return "—";
}

function groupKey(group: ConsoleIssuedEditionGroup): string {
  return group.submissionId?.trim() || group.editions[0]?.editionId || "unknown";
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 text-neutral-500 transition-transform ${open ? "rotate-90" : ""}`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.25 3.95a.75.75 0 010 1.08l-4.25 3.95a.75.75 0 01-1.06-.02z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function ConsoleCertificatesTable({
  groups,
  labels,
  locale,
  basePath,
  listQuery,
  rowNumberStart,
  previewMode,
}: {
  groups: ConsoleIssuedEditionGroup[];
  labels: ConsoleMessages["certificates"];
  locale: string;
  basePath: string;
  listQuery: ConsoleListQueryParams;
  rowNumberStart: number;
  previewMode: boolean;
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

  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const toggle = useCallback((key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const colSpan = 9;

  const renderEditionCells = (row: ConsoleIssuedEditionRow, nested: boolean) => (
    <>
      <td className={`px-4 py-3 text-neutral-700 ${nested ? "pl-8" : ""}`}>{ownerLabel(row)}</td>
      <td className="px-4 py-3 tabular-nums text-neutral-700">
        {row.editionNumber}/{row.editionTotal}
      </td>
      <td className="px-4 py-3 text-neutral-600">
        {row.mintedAt ? dateFmt.format(new Date(row.mintedAt)) : "—"}
      </td>
      <td className={`px-4 py-3 font-mono text-xs text-neutral-500 ${nested ? "pl-6" : ""}`}>
        {row.editionId}
      </td>
    </>
  );

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
        <table className="w-full min-w-[72rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-xs font-medium uppercase tracking-wide text-neutral-600">
              <th className="w-14 px-3 py-3 text-center">{labels.colNo}</th>
              <th className="w-10 px-2 py-3" aria-hidden />
              <ConsoleSortableTh basePath={basePath} column="submission" label={labels.colSubmissionId} listQuery={listQuery} />
              <ConsoleSortableTh basePath={basePath} column="link" label={labels.colLink} listQuery={listQuery} />
              <ConsoleSortableTh basePath={basePath} column="title" label={labels.colTitle} listQuery={listQuery} />
              <ConsoleSortableTh basePath={basePath} column="owner" label={labels.colOwner} listQuery={listQuery} />
              <ConsoleSortableTh basePath={basePath} column="edition" label={labels.colEdition} listQuery={listQuery} />
              <ConsoleSortableTh basePath={basePath} column="minted" label={labels.colMinted} listQuery={listQuery} />
              <ConsoleSortableTh basePath={basePath} column="editionId" label={labels.colEditionId} listQuery={listQuery} />
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-4 py-10 text-center text-neutral-500">
                  {labels.empty}
                </td>
              </tr>
            ) : (
              groups.map((group, groupIndex) => {
                const key = groupKey(group);
                const multi = group.issuedCount > 1;
                const open = expanded.has(key);
                const rowNo = rowNumberStart + groupIndex;

                if (!multi) {
                  const row = group.editions[0]!;
                  return (
                    <tr key={key} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/80">
                      <td className="px-3 py-3 text-center font-mono text-xs tabular-nums text-neutral-500">
                        {rowNo}
                      </td>
                      <td className="px-2 py-3" />
                      <td className="px-4 py-3 font-mono text-xs text-neutral-500">{row.submissionId ?? "—"}</td>
                      <td className="px-4 py-3 text-xs text-neutral-600">
                        {row.linkStatus === "linked" ? labels.linkLinked : labels.linkUnlinked}
                      </td>
                      <td className="px-4 py-3 font-medium text-neutral-900">
                        {row.submissionId ? (
                          <ConsoleArtworkTitleHoverPreview
                            title={row.artworkTitle}
                            submissionId={row.submissionId}
                            previewMode={previewMode}
                          />
                        ) : (
                          row.artworkTitle || "—"
                        )}
                      </td>
                      {renderEditionCells(row, false)}
                    </tr>
                  );
                }

                const summaryOwner = ownerLabel(group.editions[0]!);
                const editionSummary = labels.issuedEditionsTpl
                  .replace("{issued}", String(group.issuedCount))
                  .replace("{total}", String(group.editionTotal));

                return (
                  <Fragment key={key}>
                    <tr
                      className="border-b border-neutral-200 bg-neutral-50/90 hover:bg-neutral-100/80"
                      onClick={() => toggle(key)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggle(key);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-expanded={open}
                      aria-label={
                        open
                          ? labels.collapseEditions.replace("{title}", group.artworkTitle)
                          : labels.expandEditions.replace("{title}", group.artworkTitle)
                      }
                    >
                      <td className="px-3 py-3 text-center font-mono text-xs tabular-nums text-neutral-500">
                        {rowNo}
                      </td>
                      <td className="px-2 py-3">
                        <Chevron open={open} />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-neutral-600">{group.submissionId ?? "—"}</td>
                      <td className="px-4 py-3 text-xs text-neutral-600">
                        {group.linkStatus === "linked" ? labels.linkLinked : labels.linkUnlinked}
                      </td>
                      <td className="px-4 py-3 font-medium text-neutral-900">
                        {group.submissionId ? (
                          <ConsoleArtworkTitleHoverPreview
                            title={group.artworkTitle}
                            submissionId={group.submissionId}
                            previewMode={previewMode}
                          />
                        ) : (
                          group.artworkTitle || "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">{summaryOwner}</td>
                      <td className="px-4 py-3 tabular-nums text-neutral-700">{editionSummary}</td>
                      <td className="px-4 py-3 text-neutral-600">
                        {group.latestMintedAt ? dateFmt.format(new Date(group.latestMintedAt)) : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-neutral-500">—</td>
                    </tr>
                    {open
                      ? group.editions.map((row) => (
                          <tr
                            key={row.editionId}
                            className="border-b border-neutral-100 bg-white last:border-0"
                          >
                            <td className="px-3 py-2" />
                            <td className="px-2 py-2" />
                            <td className="px-4 py-2 pl-8 font-mono text-[0.65rem] text-neutral-400" colSpan={3}>
                              {labels.editionRowLabel.replace("{n}", String(row.editionNumber))}
                            </td>
                            {renderEditionCells(row, true)}
                          </tr>
                        ))
                      : null}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
