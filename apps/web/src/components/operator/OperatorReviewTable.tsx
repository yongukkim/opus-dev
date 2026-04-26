"use client";

import { useMemo, useState } from "react";
import type { Messages } from "@/i18n/types";

type ReviewStatus = "pending_review" | "approved" | "changes_requested" | "rejected";
type ContentRating = "general" | "mature" | "explicit";

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

export function OperatorReviewTable({
  m,
  rows,
}: {
  m: Messages;
  rows: OperatorReviewRow[];
}) {
  const s = m.operatorReview;
  const [filter, setFilter] = useState<ReviewStatus | "all">("pending_review");
  const [pending, setPending] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (filter === "all") return rows;
    return rows.filter((r) => r.reviewStatus === filter);
  }, [rows, filter]);
  const pendingRows = useMemo(() => rows.filter((r) => r.reviewStatus === "pending_review"), [rows]);
  const selectedRow =
    pendingRows.find((r) => r.id === selectedId) ??
    pendingRows[0] ??
    null;

  async function setReview(id: string, next: { reviewStatus: ReviewStatus; contentRating: ContentRating }) {
    if (pending) return;
    setPending(id);
    try {
      const res = await fetch(`/api/operator/submissions/${encodeURIComponent(id)}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...next }),
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

  return (
    <div className="mt-10 space-y-4">
      <div className="rounded-xl border border-white/[0.08] bg-opus-slate/20 p-4">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-opus-warm/45">{s.filterPending}</p>
        {pendingRows.length === 0 ? (
          <p className="mt-3 text-sm text-opus-warm/55">No pending submissions.</p>
        ) : (
          <>
            <ul className="mt-4 flex gap-3 overflow-x-auto pb-2">
              {pendingRows.map((r) => {
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
                          <div className="flex h-full items-center justify-center text-[0.65rem] text-opus-warm/55">VIDEO</div>
                        )}
                      </div>
                      <p className="truncate px-2 py-1.5 text-[0.68rem] text-opus-warm/75">{r.artworkTitle}</p>
                    </button>
                  </li>
                );
              })}
            </ul>
            {selectedRow ? (
              <div className="mt-4 rounded-lg border border-white/[0.1] bg-black/25 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-opus-warm/80">{selectedRow.artworkTitle}</p>
                  <a
                    href={`/api/artwork-submissions/${encodeURIComponent(selectedRow.id)}/download`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded border border-white/[0.16] px-3 py-1.5 text-xs text-opus-warm/75 transition hover:border-opus-gold/35"
                  >
                    Open original
                  </a>
                </div>
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
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={pending === selectedRow.id}
                    onClick={() => setReview(selectedRow.id, { reviewStatus: "approved", contentRating: "general" })}
                    className="rounded-md border border-white/[0.12] bg-white/[0.04] px-3 py-2 text-xs text-opus-warm/75 transition hover:border-opus-gold/35 hover:bg-white/[0.06] disabled:opacity-50"
                  >
                    {s.approve}
                  </button>
                  <button
                    type="button"
                    disabled={pending === selectedRow.id}
                    onClick={() => setReview(selectedRow.id, { reviewStatus: "approved", contentRating: "mature" })}
                    className="rounded-md border border-white/[0.12] bg-white/[0.04] px-3 py-2 text-xs text-opus-warm/75 transition hover:border-opus-gold/35 hover:bg-white/[0.06] disabled:opacity-50"
                  >
                    {s.approveMature}
                  </button>
                  <button
                    type="button"
                    disabled={pending === selectedRow.id}
                    onClick={() => setReview(selectedRow.id, { reviewStatus: "rejected", contentRating: "explicit" })}
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
                  <p className="mt-1 font-mono text-[0.65rem] text-opus-warm/40">{r.id}</p>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm text-opus-warm/70">{r.nickname}</p>
                  <p className="mt-1 font-mono text-[0.65rem] text-opus-warm/35">{r.artistId}</p>
                </div>
                <span className={`h-fit w-fit rounded-full border px-3 py-1 text-[0.65rem] ${badgeClass(statusKind as any)}`}>
                  {r.reviewStatus}
                </span>
                <span className={`h-fit w-fit rounded-full border px-3 py-1 text-[0.65rem] ${badgeClass(ratingKind as any)}`}>
                  {r.contentRating}
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setReview(r.id, { reviewStatus: "approved", contentRating: "general" })}
                    className="rounded-md border border-white/[0.12] bg-white/[0.04] px-3 py-2 text-xs text-opus-warm/75 transition hover:border-opus-gold/35 hover:bg-white/[0.06] disabled:opacity-50"
                  >
                    {s.approve}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setReview(r.id, { reviewStatus: "approved", contentRating: "mature" })}
                    className="rounded-md border border-white/[0.12] bg-white/[0.04] px-3 py-2 text-xs text-opus-warm/75 transition hover:border-opus-gold/35 hover:bg-white/[0.06] disabled:opacity-50"
                  >
                    {s.approveMature}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setReview(r.id, { reviewStatus: "rejected", contentRating: "explicit" })}
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

