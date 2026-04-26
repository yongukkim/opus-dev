"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { MAX_EDITIONS, parseEditionObject, type ParsedEdition } from "@/lib/editionFields";
import type { Messages } from "@/i18n/types";

type ReviewStatus = "pending_review" | "approved" | "changes_requested" | "rejected";
type ContentRating = "general" | "mature" | "explicit";

type EditionMode = "unique" | "limited";
type NumberingPolicy = "auto" | "manual";

type EditionDraft = {
  editionMode: EditionMode;
  editionTotal: string;
  initialMint: string;
  numberingPolicy: NumberingPolicy;
  lockEdition: boolean;
};

export type OperatorReviewRow = {
  id: string;
  createdAt: string;
  artistId: string;
  nickname: string;
  artworkTitle: string;
  mime?: string;
  /** Male- / female-oriented shelf grouping when present. */
  audienceCategory?: "male" | "female" | "none";
  /** List price in JPY when present on the submission record. */
  priceJpy?: number;
  reviewStatus: ReviewStatus;
  contentRating: ContentRating;
  reviewNote?: string;
  editionMode: EditionMode;
  editionTotal: number;
  initialMint: number;
  numberingPolicy: NumberingPolicy;
  lockEdition: boolean;
};

function badgeClass(kind: "neutral" | "good" | "warn" | "bad"): string {
  if (kind === "good") return "bg-emerald-500/15 text-emerald-200 border-emerald-400/20";
  if (kind === "warn") return "bg-amber-500/15 text-amber-200 border-amber-400/20";
  if (kind === "bad") return "bg-rose-500/15 text-rose-200 border-rose-400/20";
  return "bg-white/[0.06] text-opus-warm/70 border-white/[0.10]";
}

function audienceLabel(m: Messages, cat: "male" | "female" | "none" | undefined): string | null {
  if (cat === "male") return m.submitArtwork.audienceMale;
  if (cat === "female") return m.submitArtwork.audienceFemale;
  if (cat === "none") return m.submitArtwork.audienceNone;
  return null;
}

function formatEditionLine(m: Messages, r: OperatorReviewRow): string {
  const label = m.artworks.editionLabel;
  if (r.editionMode === "unique") return `${label} 1/1`;
  return `${label} ${r.initialMint}/${r.editionTotal}`;
}

function reviewStatusLabel(m: Messages, status: ReviewStatus): string {
  const s = m.operatorReview;
  if (status === "pending_review") return s.statusPendingReview;
  if (status === "approved") return s.statusApproved;
  if (status === "changes_requested") return s.statusChangesRequested;
  return s.statusRejected;
}

function contentRatingLabel(m: Messages, rating: ContentRating): string {
  const s = m.operatorReview;
  if (rating === "general") return s.ratingGeneral;
  if (rating === "mature") return s.ratingMature;
  return s.ratingExplicit;
}

function inputClass(invalid: boolean): string {
  return `w-full rounded-md border bg-black/30 px-2.5 py-1.5 font-sans text-xs text-opus-warm/85 outline-none transition ${
    invalid
      ? "border-red-400/35 focus:border-red-300/55"
      : "border-white/[0.12] focus:border-opus-gold/45"
  }`;
}

function labelClass(): string {
  return "font-mono text-[0.6rem] uppercase tracking-[0.2em] text-opus-warm/45";
}

function hintClass(): string {
  return "mt-1 text-[0.65rem] leading-relaxed text-opus-warm/40";
}

function rowToEditionDraft(r: OperatorReviewRow): EditionDraft {
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

export function OperatorReviewTable({
  m,
  rows,
}: {
  m: Messages;
  rows: OperatorReviewRow[];
}) {
  const s = m.operatorReview;
  const sf = m.submitArtwork;
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
  }, [selectedRow?.id]);

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
    if (pending) return;
    setPending(id);
    try {
      const body: Record<string, unknown> = { ...next };
      if (options?.edition) body["edition"] = options.edition;
      if (options?.reviewNote !== undefined) body["reviewNote"] = options.reviewNote;
      const res = await fetch(`/api/operator/submissions/${encodeURIComponent(id)}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        window.alert(s.alertFail);
        return;
      }
      window.location.reload();
    } catch {
      window.alert(s.alertFail);
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
      window.alert(s.alertFail);
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
      window.alert(s.alertFail);
      return;
    }
    await setReview(
      selectedRow.id,
      { reviewStatus: "changes_requested", contentRating: selectedRow.contentRating },
      { edition: parsed, reviewNote: reviewNoteDraft.trim() },
    );
  }

  async function applyReviewFromTable(
    r: OperatorReviewRow,
    next: { reviewStatus: ReviewStatus; contentRating: ContentRating },
  ) {
    if (next.reviewStatus === "changes_requested") {
      if (typeof window !== "undefined" && !window.confirm(s.requestChangesTableConfirm)) return;
    }
    if (next.reviewStatus === "rejected" && next.contentRating === "explicit") {
      if (typeof window !== "undefined" && !window.confirm(s.rejectExplicitTableConfirm)) return;
    }
    await setReview(r.id, next);
  }

  return (
    <div className="mt-10 space-y-4">
      <div className="rounded-xl border border-white/[0.08] bg-opus-slate/20 p-4">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-opus-warm/45">
          {s.actionableStripLabel}
        </p>
        {actionableRows.length === 0 ? (
          <p className="mt-3 text-sm text-opus-warm/55">{s.actionableEmpty}</p>
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
                        active
                          ? "border-opus-gold/55 bg-opus-gold/10"
                          : "border-white/[0.12] bg-black/20 hover:border-opus-gold/35"
                      }`}
                    >
                      <div className="relative aspect-[4/5] w-full bg-black/30">
                        {isImage ? (
                          <img
                            src={`/api/artwork-submissions/${encodeURIComponent(r.id)}/download`}
                            alt={r.artworkTitle}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[0.65rem] text-opus-warm/55">
                            {s.videoPlaceholder}
                          </div>
                        )}
                      </div>
                      <p className="truncate px-2 py-1.5 text-[0.68rem] text-opus-warm/75">{r.artworkTitle}</p>
                    </button>
                  </li>
                );
              })}
            </ul>
            {selectedRow && editionDraft ? (
              <div className="mt-4 rounded-lg border border-white/[0.1] bg-black/25 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-opus-warm/80">{selectedRow.artworkTitle}</p>
                  <a
                    href={`/api/artwork-submissions/${encodeURIComponent(selectedRow.id)}/download`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded border border-white/[0.16] px-3 py-1.5 text-xs text-opus-warm/75 transition hover:border-opus-gold/35"
                  >
                    {s.openOriginal}
                  </a>
                </div>
                <p className="mt-2 font-mono text-[0.65rem] text-opus-warm/45">{formatEditionLine(m, selectedRow)}</p>
                <div className="mt-3 overflow-hidden rounded-md border border-white/[0.08] bg-black/40">
                  {(selectedRow.mime ?? "").startsWith("image/") ? (
                    <img
                      src={`/api/artwork-submissions/${encodeURIComponent(selectedRow.id)}/download`}
                      alt={selectedRow.artworkTitle}
                      className="max-h-[32rem] w-full object-contain"
                    />
                  ) : (
                    <video
                      src={`/api/artwork-submissions/${encodeURIComponent(selectedRow.id)}/download`}
                      controls
                      className="max-h-[32rem] w-full bg-black"
                    />
                  )}
                </div>

                <div className="mt-5 rounded-lg border border-white/[0.08] bg-black/20 p-4">
                  <p className="opus-text-metallic-soft font-mono text-[0.65rem] uppercase tracking-[0.24em]">
                    {s.editionPanelTitle}
                  </p>
                  <p className={hintClass()}>{s.editionPanelHint}</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className={labelClass()}>{sf.editionModeLabel}</p>
                      <div className="mt-1 grid grid-cols-2 gap-2">
                        <label className="flex items-center gap-2 rounded-md border border-white/[0.12] bg-black/25 px-2 py-1.5 text-xs text-opus-warm/75">
                          <input
                            type="radio"
                            name="editionMode"
                            value="unique"
                            checked={editionDraft.editionMode === "unique"}
                            onChange={onEditionText}
                            className="h-3.5 w-3.5 border-white/[0.25] bg-black/30 text-opus-gold focus:ring-0"
                          />
                          {sf.editionModeUnique}
                        </label>
                        <label className="flex items-center gap-2 rounded-md border border-white/[0.12] bg-black/25 px-2 py-1.5 text-xs text-opus-warm/75">
                          <input
                            type="radio"
                            name="editionMode"
                            value="limited"
                            checked={editionDraft.editionMode === "limited"}
                            onChange={onEditionText}
                            className="h-3.5 w-3.5 border-white/[0.25] bg-black/30 text-opus-gold focus:ring-0"
                          />
                          {sf.editionModeLimited}
                        </label>
                      </div>
                    </div>
                    <div>
                      <p className={labelClass()}>{sf.editionTotalLabel}</p>
                      <input
                        name="editionTotal"
                        value={editionDraft.editionTotal}
                        onChange={onEditionText}
                        onBlur={() => markEditionTouched("editionTotal")}
                        className={inputClass(invalidEdition("editionTotal"))}
                        inputMode="numeric"
                        min={1}
                        max={MAX_EDITIONS}
                        disabled={editionDraft.editionMode === "unique"}
                      />
                      <p className={hintClass()}>{sf.editionTotalHint}</p>
                      {invalidEdition("editionTotal") ? (
                        <p className="mt-1 text-[0.65rem] text-red-300/70">{sf.editionTotalInvalid}</p>
                      ) : null}
                    </div>
                    <div>
                      <p className={labelClass()}>{sf.initialMintLabel}</p>
                      <input
                        name="initialMint"
                        value={editionDraft.initialMint}
                        onChange={onEditionText}
                        onBlur={() => markEditionTouched("initialMint")}
                        className={inputClass(invalidEdition("initialMint"))}
                        inputMode="numeric"
                        min={1}
                        max={editionDraft.editionTotal || MAX_EDITIONS}
                      />
                      <p className={hintClass()}>{sf.initialMintHint}</p>
                      {invalidEdition("initialMint") ? (
                        <p className="mt-1 text-[0.65rem] text-red-300/70">{sf.initialMintInvalid}</p>
                      ) : null}
                    </div>
                    <div>
                      <p className={labelClass()}>{sf.numberingPolicyLabel}</p>
                      <select
                        name="numberingPolicy"
                        value={editionDraft.numberingPolicy}
                        onChange={onEditionText}
                        onBlur={() => markEditionTouched("numberingPolicy")}
                        className={inputClass(false)}
                      >
                        <option value="auto">{sf.numberingPolicyAuto}</option>
                        <option value="manual">{sf.numberingPolicyManual}</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <p className={labelClass()}>{sf.lockEditionLabel}</p>
                      <label className="mt-2 flex gap-2 text-xs text-opus-warm/75">
                        <input
                          type="checkbox"
                          name="lockEdition"
                          checked={editionDraft.lockEdition}
                          onChange={onEditionCheckbox}
                          onBlur={() => markEditionTouched("lockEdition")}
                          className="mt-0.5 h-3.5 w-3.5 rounded border-white/[0.25] bg-black/30 text-opus-gold focus:ring-0"
                        />
                        <span className="leading-relaxed">{sf.lockEditionHint}</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  <p className={labelClass()}>{s.reviewNoteLabel}</p>
                  <textarea
                    value={reviewNoteDraft}
                    onChange={(e) => setReviewNoteDraft(e.target.value)}
                    rows={3}
                    maxLength={800}
                    placeholder={s.reviewNotePlaceholder}
                    className="mt-2 w-full resize-y rounded-md border border-white/[0.12] bg-black/30 px-3 py-2 font-sans text-xs text-opus-warm/85 outline-none transition placeholder:text-opus-warm/35 focus:border-opus-gold/45"
                  />
                  <p className={hintClass()}>{s.reviewNoteHint}</p>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={pending === selectedRow.id}
                    onClick={() => void applyReviewFromPanel({ reviewStatus: "approved", contentRating: "general" })}
                    className="rounded-md border border-white/[0.12] bg-white/[0.04] px-3 py-2 text-xs text-opus-warm/75 transition hover:border-opus-gold/35 hover:bg-white/[0.06] disabled:opacity-50"
                  >
                    {s.approve}
                  </button>
                  <button
                    type="button"
                    disabled={pending === selectedRow.id}
                    onClick={() => void applyReviewFromPanel({ reviewStatus: "approved", contentRating: "mature" })}
                    className="rounded-md border border-white/[0.12] bg-white/[0.04] px-3 py-2 text-xs text-opus-warm/75 transition hover:border-opus-gold/35 hover:bg-white/[0.06] disabled:opacity-50"
                  >
                    {s.approveMature}
                  </button>
                  <button
                    type="button"
                    disabled={pending === selectedRow.id}
                    onClick={() => void applyRequestChangesFromPanel()}
                    className="rounded-md border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100/90 transition hover:border-amber-300/40 hover:bg-amber-500/15 disabled:opacity-50"
                  >
                    {s.requestChanges}
                  </button>
                  <button
                    type="button"
                    disabled={pending === selectedRow.id}
                    onClick={() => void applyReviewFromPanel({ reviewStatus: "rejected", contentRating: "explicit" })}
                    className="rounded-md border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-200/85 transition hover:border-rose-300/40 hover:bg-rose-500/15 disabled:opacity-50"
                  >
                    {s.rejectExplicit}
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-opus-warm/45">
            {s.filterLabel}
          </span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as ReviewStatus | "all")}
            className="rounded-md border border-white/[0.12] bg-black/25 px-3 py-2 text-xs text-opus-warm/80 outline-none transition focus:border-opus-gold/45"
          >
            <option value="pending_review">{s.filterPending}</option>
            <option value="approved">{s.filterApproved}</option>
            <option value="changes_requested">{s.filterChanges}</option>
            <option value="rejected">{s.filterRejected}</option>
            <option value="all">{s.filterAll}</option>
          </select>
        </div>
        <p className="text-xs text-opus-warm/45">{s.note}</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-opus-slate/20 shadow-opus-card">
        <div className="grid grid-cols-[1.2fr,1fr,0.9fr,0.9fr,1.1fr] gap-3 border-b border-white/[0.06] px-5 py-4 text-xs text-opus-warm/55">
          <span>{s.colArtwork}</span>
          <span>{s.colArtist}</span>
          <span>{s.colStatus}</span>
          <span>{s.colRating}</span>
          <span>{s.colActions}</span>
        </div>
        <ul className="divide-y divide-white/[0.06]">
          {filtered.map((r) => {
            const statusKind =
              r.reviewStatus === "approved"
                ? "good"
                : r.reviewStatus === "pending_review"
                  ? "neutral"
                  : r.reviewStatus === "changes_requested"
                    ? "warn"
                    : "bad";
            const ratingKind = r.contentRating === "general" ? "neutral" : r.contentRating === "mature" ? "warn" : "bad";
            const busy = pending === r.id;
            const canRequestChanges = r.reviewStatus === "pending_review" || r.reviewStatus === "changes_requested";
            const audienceLine = audienceLabel(m, r.audienceCategory);
            return (
              <li key={r.id} className="grid grid-cols-[1.2fr,1fr,0.9fr,0.9fr,1.1fr] gap-3 px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate font-sans text-sm text-opus-warm/85">{r.artworkTitle}</p>
                  {audienceLine ? (
                    <p className="mt-1 font-mono text-[0.65rem] text-opus-warm/45">{audienceLine}</p>
                  ) : null}
                  {typeof r.priceJpy === "number" && Number.isFinite(r.priceJpy) ? (
                    <p className="mt-1 font-mono text-[0.65rem] text-opus-warm/50">
                      ¥{r.priceJpy.toLocaleString("ja-JP")}
                    </p>
                  ) : null}
                  <p className="mt-1 font-mono text-[0.65rem] text-opus-warm/50">{formatEditionLine(m, r)}</p>
                  <p className="mt-1 font-mono text-[0.65rem] text-opus-warm/40">{r.id}</p>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm text-opus-warm/70">{r.nickname}</p>
                  <p className="mt-1 font-mono text-[0.65rem] text-opus-warm/35">{r.artistId}</p>
                </div>
                <span
                  className={`h-fit w-fit rounded-full border px-3 py-1 text-[0.65rem] ${badgeClass(statusKind as "neutral" | "good" | "warn" | "bad")}`}
                >
                  {reviewStatusLabel(m, r.reviewStatus)}
                </span>
                <span
                  className={`h-fit w-fit rounded-full border px-3 py-1 text-[0.65rem] ${badgeClass(ratingKind as "neutral" | "good" | "warn" | "bad")}`}
                >
                  {contentRatingLabel(m, r.contentRating)}
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void applyReviewFromTable(r, { reviewStatus: "approved", contentRating: "general" })}
                    className="rounded-md border border-white/[0.12] bg-white/[0.04] px-3 py-2 text-xs text-opus-warm/75 transition hover:border-opus-gold/35 hover:bg-white/[0.06] disabled:opacity-50"
                  >
                    {s.approve}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void applyReviewFromTable(r, { reviewStatus: "approved", contentRating: "mature" })}
                    className="rounded-md border border-white/[0.12] bg-white/[0.04] px-3 py-2 text-xs text-opus-warm/75 transition hover:border-opus-gold/35 hover:bg-white/[0.06] disabled:opacity-50"
                  >
                    {s.approveMature}
                  </button>
                  <button
                    type="button"
                    disabled={busy || !canRequestChanges}
                    onClick={() =>
                      void applyReviewFromTable(r, { reviewStatus: "changes_requested", contentRating: r.contentRating })
                    }
                    className="rounded-md border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100/90 transition hover:border-amber-300/40 hover:bg-amber-500/15 disabled:opacity-50"
                  >
                    {s.requestChanges}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void applyReviewFromTable(r, { reviewStatus: "rejected", contentRating: "explicit" })}
                    className="rounded-md border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-200/85 transition hover:border-rose-300/40 hover:bg-rose-500/15 disabled:opacity-50"
                  >
                    {s.rejectExplicit}
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
