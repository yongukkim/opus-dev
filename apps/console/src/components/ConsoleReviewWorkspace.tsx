"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { MAX_EDITIONS, parseEditionObject, type ParsedEdition } from "@/lib/editionFields";
import type { ReviewRow } from "@/lib/submissionRow";

type ReviewStatus = ReviewRow["reviewStatus"];
type ContentRating = ReviewRow["contentRating"];
type EditionMode = "unique" | "limited";
type NumberingPolicy = "auto" | "manual";

type EditionDraft = {
  editionMode: EditionMode;
  editionTotal: string;
  initialMint: string;
  numberingPolicy: NumberingPolicy;
  lockEdition: boolean;
};

function badgeClass(kind: "neutral" | "good" | "warn" | "bad"): string {
  if (kind === "good") return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  if (kind === "warn") return "bg-amber-50 text-amber-900 ring-amber-200";
  if (kind === "bad") return "bg-rose-50 text-rose-800 ring-rose-200";
  return "bg-gray-50 text-gray-700 ring-gray-200";
}

function statusLabel(s: ReviewStatus): string {
  const m: Record<ReviewStatus, string> = {
    pending_review: "Pending",
    approved: "Approved",
    changes_requested: "Changes",
    rejected: "Rejected",
  };
  return m[s];
}

function ratingLabel(r: ContentRating): string {
  const m: Record<ContentRating, string> = { general: "General", mature: "Mature", explicit: "Explicit" };
  return m[r];
}

function formatEdition(r: ReviewRow): string {
  if (r.editionMode === "unique") return "Edition 1/1";
  return `Edition ${r.initialMint}/${r.editionTotal}`;
}

function rowToEditionDraft(r: ReviewRow): EditionDraft {
  return {
    editionMode: r.editionMode,
    editionTotal: String(r.editionTotal),
    initialMint: String(r.initialMint),
    numberingPolicy: r.numberingPolicy,
    lockEdition: r.lockEdition,
  };
}

function editionDraftErrors(d: EditionDraft): Partial<Record<keyof EditionDraft, true>> {
  const e: Partial<Record<keyof EditionDraft, true>> = {};
  const total = Number.parseInt(d.editionTotal, 10);
  if (!Number.isFinite(total) || total < 1 || total > MAX_EDITIONS) e.editionTotal = true;
  if (d.editionMode === "unique" && d.editionTotal !== "1") e.editionTotal = true;
  const initialN = Number.parseInt(d.initialMint, 10);
  const cap = Number.isFinite(total) ? total : MAX_EDITIONS;
  if (!Number.isFinite(initialN) || initialN < 1 || initialN > cap) e.initialMint = true;
  return e;
}

function draftToParsedEdition(d: EditionDraft): ParsedEdition | null {
  const parsed = parseEditionObject({
    editionMode: d.editionMode,
    editionTotal: Number.parseInt(d.editionTotal, 10),
    initialMint: Number.parseInt(d.initialMint, 10),
    numberingPolicy: d.numberingPolicy,
    lockEdition: d.lockEdition,
  });
  return parsed.ok ? parsed.value : null;
}

const inputCls = (invalid: boolean) =>
  `mt-1 w-full rounded-md border px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 ${
    invalid ? "border-red-300 bg-red-50" : "border-gray-300 bg-white"
  }`;

export function ConsoleReviewWorkspace({
  initialRows,
  readOnlyPreview = false,
}: {
  initialRows: ReviewRow[];
  /** Local dev: no API calls; buttons disabled. */
  readOnlyPreview?: boolean;
}) {
  const rows = initialRows;
  const [filter, setFilter] = useState<ReviewStatus | "all">("pending_review");
  const [pending, setPending] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editionDraft, setEditionDraft] = useState<EditionDraft | null>(null);
  const [editionTouched, setEditionTouched] = useState<Partial<Record<keyof EditionDraft, boolean>>>({});
  const [reviewNoteDraft, setReviewNoteDraft] = useState("");

  const filtered = useMemo(() => {
    if (filter === "all") return rows;
    return rows.filter((r) => r.reviewStatus === filter);
  }, [rows, filter]);

  const actionableRows = useMemo(
    () => rows.filter((r) => r.reviewStatus === "pending_review" || r.reviewStatus === "changes_requested"),
    [rows],
  );

  const selectedRow =
    actionableRows.find((r) => r.id === selectedId) ?? actionableRows[0] ?? null;

  useEffect(() => {
    if (!selectedRow) {
      setEditionDraft(null);
      setEditionTouched({});
      setReviewNoteDraft("");
      return;
    }
    setEditionDraft(rowToEditionDraft(selectedRow));
    setEditionTouched({});
    setReviewNoteDraft(selectedRow.reviewNote ?? "");
  }, [selectedRow]);

  const editionErrors = useMemo(() => (editionDraft ? editionDraftErrors(editionDraft) : {}), [editionDraft]);
  const invalidEdition = (k: keyof EditionDraft) => Boolean(editionTouched[k] && editionErrors[k]);

  function onEditionText(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setEditionDraft((d) => {
      if (!d) return d;
      if (name === "editionMode") {
        const mode = value as EditionMode;
        if (mode === "unique") {
          return { ...d, editionMode: mode, editionTotal: "1", initialMint: "1" };
        }
        return { ...d, editionMode: mode };
      }
      if (name === "editionTotal") {
        const nextTotal =
          value === "" ? "" : String(Math.max(1, Math.min(MAX_EDITIONS, Number.parseInt(value || "1", 10) || 1)));
        const currentInitial = Number.parseInt(d.initialMint, 10);
        const parsedTotal = Number.parseInt(nextTotal, 10);
        const nextInitial =
          Number.isFinite(currentInitial) && Number.isFinite(parsedTotal) && currentInitial > parsedTotal
            ? nextTotal
            : d.initialMint;
        return { ...d, editionTotal: nextTotal, initialMint: nextInitial };
      }
      if (name === "initialMint") {
        const parsedTotal = Number.parseInt(d.editionTotal, 10);
        const capped = value === "" ? "" : String(Math.max(1, Number.parseInt(value || "1", 10) || 1));
        if (Number.isFinite(parsedTotal) && Number.parseInt(capped, 10) > parsedTotal) {
          return { ...d, initialMint: String(parsedTotal) };
        }
        return { ...d, initialMint: capped };
      }
      if (name === "numberingPolicy") {
        return { ...d, numberingPolicy: value as NumberingPolicy };
      }
      return d;
    });
  }

  function onEditionCheckbox(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.name === "lockEdition") {
      setEditionDraft((d) => (d ? { ...d, lockEdition: e.target.checked } : d));
    }
  }

  function markEditionTouched(k: keyof EditionDraft) {
    setEditionTouched((t) => ({ ...t, [k]: true }));
  }

  async function setReview(
    id: string,
    next: { reviewStatus: ReviewStatus; contentRating: ContentRating },
    options?: { edition?: ParsedEdition; reviewNote?: string },
  ) {
    if (readOnlyPreview) {
      window.alert("Preview mode: sign in with an operator account to submit reviews.");
      return;
    }
    if (pending) return;
    setPending(id);
    try {
      const body: Record<string, unknown> = { ...next };
      if (options?.edition) body["edition"] = options.edition;
      if (options?.reviewNote !== undefined) body["reviewNote"] = options.reviewNote;
      const res = await fetch(`/api/bridge/submissions/${encodeURIComponent(id)}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        window.alert("Review update failed.");
        return;
      }
      window.location.reload();
    } catch {
      window.alert("Review update failed.");
    } finally {
      setPending(null);
    }
  }

  async function applyReviewFromPanel(next: { reviewStatus: ReviewStatus; contentRating: ContentRating }) {
    if (!selectedRow || !editionDraft) return;
    setEditionTouched({
      editionMode: true,
      editionTotal: true,
      initialMint: true,
      numberingPolicy: true,
      lockEdition: true,
    });
    const parsed = draftToParsedEdition(editionDraft);
    if (!parsed) {
      window.alert("Invalid edition fields.");
      return;
    }
    const opts: { edition: ParsedEdition; reviewNote?: string } = { edition: parsed };
    if (next.reviewStatus === "rejected") opts.reviewNote = reviewNoteDraft.trim();
    await setReview(selectedRow.id, next, opts);
  }

  async function applyRequestChangesFromPanel() {
    if (!selectedRow || !editionDraft) return;
    setEditionTouched({
      editionMode: true,
      editionTotal: true,
      initialMint: true,
      numberingPolicy: true,
      lockEdition: true,
    });
    const parsed = draftToParsedEdition(editionDraft);
    if (!parsed) {
      window.alert("Invalid edition fields.");
      return;
    }
    await setReview(
      selectedRow.id,
      { reviewStatus: "changes_requested", contentRating: selectedRow.contentRating },
      { edition: parsed, reviewNote: reviewNoteDraft.trim() },
    );
  }

  async function applyReviewFromTable(r: ReviewRow, next: { reviewStatus: ReviewStatus; contentRating: ContentRating }) {
    if (next.reviewStatus === "changes_requested") {
      if (!window.confirm("Request changes for this submission?")) return;
    }
    if (next.reviewStatus === "rejected" && next.contentRating === "explicit") {
      if (!window.confirm("Reject as explicit content?")) return;
    }
    await setReview(r.id, next);
  }

  const assetUrl = (id: string) => `/api/bridge/submissions/${encodeURIComponent(id)}/download`;

  return (
    <div className="mt-8 space-y-6">
      {readOnlyPreview ? (
        <p className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-600">
          Preview mode — sample rows only. Asset thumbnails and review actions stay disabled until you sign in.
        </p>
      ) : null}
      <section className="rounded-lg border border-gray-200 bg-gray-50/80 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Queue</p>
        {actionableRows.length === 0 ? (
          <p className="mt-2 text-sm text-gray-600">No items pending review.</p>
        ) : (
          <>
            <ul className="mt-4 flex gap-3 overflow-x-auto pb-2">
              {actionableRows.map((r) => {
                const isImage = (r.mime ?? "").startsWith("image/");
                const active = selectedRow?.id === r.id;
                return (
                  <li key={r.id} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedId(r.id)}
                      className={`w-28 overflow-hidden rounded-lg border text-left transition ${
                        active ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div className="relative aspect-[4/5] w-full bg-gray-100">
                        {readOnlyPreview ? (
                          <div className="flex h-full items-center justify-center px-1 text-center text-[0.6rem] text-gray-500">
                            No asset
                          </div>
                        ) : isImage ? (
                          // eslint-disable-next-line @next/next/no-img-element -- dynamic operator asset URLs; avoid Image remotePatterns churn
                          <img src={assetUrl(r.id)} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[0.65rem] text-gray-500">Video</div>
                        )}
                      </div>
                      <p className="truncate px-2 py-1.5 text-xs text-gray-800">{r.artworkTitle}</p>
                    </button>
                  </li>
                );
              })}
            </ul>
            {selectedRow && editionDraft ? (
              <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-base font-medium text-gray-900">{selectedRow.artworkTitle}</h2>
                  {readOnlyPreview ? (
                    <span className="rounded-md border border-dashed border-gray-300 px-3 py-1.5 text-xs text-gray-500">
                      Asset N/A
                    </span>
                  ) : (
                    <a
                      href={assetUrl(selectedRow.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Open asset
                    </a>
                  )}
                </div>
                <p className="mt-1 font-mono text-xs text-gray-500">{formatEdition(selectedRow)}</p>
                <div className="mt-3 overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                  {readOnlyPreview ? (
                    <div className="flex min-h-[12rem] items-center justify-center bg-gray-100 text-sm text-gray-500">
                      No asset in preview
                    </div>
                  ) : (selectedRow.mime ?? "").startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element -- dynamic operator asset URLs; avoid Image remotePatterns churn
                    <img src={assetUrl(selectedRow.id)} alt="" className="max-h-[28rem] w-full object-contain" />
                  ) : (
                    <video src={assetUrl(selectedRow.id)} controls className="max-h-[28rem] w-full bg-black" />
                  )}
                </div>

                <div className={`mt-5 rounded-lg border border-gray-200 p-4 ${readOnlyPreview ? "opacity-80" : ""}`}>
                  <p className="text-xs font-medium uppercase text-gray-500">Edition (editable while pending)</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-gray-600">Mode</p>
                      <div className="mt-1 flex gap-3 text-sm">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="editionMode"
                            value="unique"
                            checked={editionDraft.editionMode === "unique"}
                            onChange={onEditionText}
                            disabled={readOnlyPreview}
                          />
                          Unique
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="editionMode"
                            value="limited"
                            checked={editionDraft.editionMode === "limited"}
                            onChange={onEditionText}
                            disabled={readOnlyPreview}
                          />
                          Limited
                        </label>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Total</p>
                      <input
                        name="editionTotal"
                        value={editionDraft.editionTotal}
                        onChange={onEditionText}
                        onBlur={() => markEditionTouched("editionTotal")}
                        className={inputCls(invalidEdition("editionTotal"))}
                        inputMode="numeric"
                        disabled={readOnlyPreview || editionDraft.editionMode === "unique"}
                      />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Initial mint</p>
                      <input
                        name="initialMint"
                        value={editionDraft.initialMint}
                        onChange={onEditionText}
                        onBlur={() => markEditionTouched("initialMint")}
                        className={inputCls(invalidEdition("initialMint"))}
                        inputMode="numeric"
                        disabled={readOnlyPreview}
                      />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Numbering</p>
                      <select
                        name="numberingPolicy"
                        value={editionDraft.numberingPolicy}
                        onChange={onEditionText}
                        className={inputCls(false)}
                        disabled={readOnlyPreview}
                      >
                        <option value="auto">Auto</option>
                        <option value="manual">Manual</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="flex gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          name="lockEdition"
                          checked={editionDraft.lockEdition}
                          onChange={onEditionCheckbox}
                          disabled={readOnlyPreview}
                        />
                        Lock edition after approval
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-xs text-gray-600">Note to artist (rejection / changes)</p>
                  <textarea
                    value={reviewNoteDraft}
                    onChange={(e) => setReviewNoteDraft(e.target.value)}
                    rows={3}
                    maxLength={800}
                    disabled={readOnlyPreview}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 disabled:bg-gray-100"
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={readOnlyPreview || pending === selectedRow.id}
                    onClick={() => void applyReviewFromPanel({ reviewStatus: "approved", contentRating: "general" })}
                    className="rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    Approve (general)
                  </button>
                  <button
                    type="button"
                    disabled={readOnlyPreview || pending === selectedRow.id}
                    onClick={() => void applyReviewFromPanel({ reviewStatus: "approved", contentRating: "mature" })}
                    className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Approve (mature)
                  </button>
                  <button
                    type="button"
                    disabled={readOnlyPreview || pending === selectedRow.id}
                    onClick={() => void applyRequestChangesFromPanel()}
                    className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900 hover:bg-amber-100 disabled:opacity-50"
                  >
                    Request changes
                  </button>
                  <button
                    type="button"
                    disabled={readOnlyPreview || pending === selectedRow.id}
                    onClick={() => void applyReviewFromPanel({ reviewStatus: "rejected", contentRating: "explicit" })}
                    className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-900 hover:bg-rose-100 disabled:opacity-50"
                  >
                    Reject (explicit)
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-medium uppercase text-gray-500">Filter</span>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as ReviewStatus | "all")}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="pending_review">Pending</option>
          <option value="approved">Approved</option>
          <option value="changes_requested">Changes requested</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
        <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto_auto_minmax(0,1.2fr)] gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-medium text-gray-600">
          <span>Artwork</span>
          <span>Artist</span>
          <span>Status</span>
          <span>Rating</span>
          <span>Actions</span>
        </div>
        <ul className="divide-y divide-gray-100">
          {filtered.map((r) => {
            const statusKind =
              r.reviewStatus === "approved"
                ? "good"
                : r.reviewStatus === "pending_review"
                  ? "neutral"
                  : r.reviewStatus === "changes_requested"
                    ? "warn"
                    : "bad";
            const ratingKind =
              r.contentRating === "general" ? "neutral" : r.contentRating === "mature" ? "warn" : "bad";
            const busy = pending === r.id;
            const canRequestChanges = r.reviewStatus === "pending_review" || r.reviewStatus === "changes_requested";
            return (
              <li
                key={r.id}
                className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto_auto_minmax(0,1.2fr)] gap-3 px-4 py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-900">{r.artworkTitle}</p>
                  {typeof r.priceJpy === "number" ? (
                    <p className="mt-0.5 font-mono text-xs text-gray-500">¥{r.priceJpy.toLocaleString("ja-JP")}</p>
                  ) : null}
                  <p className="mt-0.5 font-mono text-xs text-gray-400">{formatEdition(r)}</p>
                  <p className="font-mono text-xs text-gray-400">{r.id}</p>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-gray-800">{r.nickname}</p>
                  <p className="font-mono text-xs text-gray-400">{r.artistId}</p>
                </div>
                <span className={`h-fit w-fit rounded-full px-2.5 py-0.5 text-xs ring-1 ${badgeClass(statusKind)}`}>
                  {statusLabel(r.reviewStatus)}
                </span>
                <span className={`h-fit w-fit rounded-full px-2.5 py-0.5 text-xs ring-1 ${badgeClass(ratingKind)}`}>
                  {ratingLabel(r.contentRating)}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    disabled={readOnlyPreview || busy}
                    onClick={() => void applyReviewFromTable(r, { reviewStatus: "approved", contentRating: "general" })}
                    className="rounded border border-gray-200 bg-white px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
                  >
                    OK
                  </button>
                  <button
                    type="button"
                    disabled={readOnlyPreview || busy}
                    onClick={() => void applyReviewFromTable(r, { reviewStatus: "approved", contentRating: "mature" })}
                    className="rounded border border-gray-200 bg-white px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
                  >
                    Mature
                  </button>
                  <button
                    type="button"
                    disabled={readOnlyPreview || busy || !canRequestChanges}
                    onClick={() =>
                      void applyReviewFromTable(r, { reviewStatus: "changes_requested", contentRating: r.contentRating })
                    }
                    className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-900 disabled:opacity-50"
                  >
                    Changes
                  </button>
                  <button
                    type="button"
                    disabled={readOnlyPreview || busy}
                    onClick={() => void applyReviewFromTable(r, { reviewStatus: "rejected", contentRating: "explicit" })}
                    className="rounded border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-900 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
