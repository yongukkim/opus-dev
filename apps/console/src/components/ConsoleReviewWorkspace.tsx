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
  if (kind === "good") return "bg-emerald-950/60 text-emerald-300 ring-emerald-700/40";
  if (kind === "warn") return "bg-amber-950/60 text-amber-300 ring-amber-700/40";
  if (kind === "bad") return "bg-rose-950/60 text-rose-300 ring-rose-700/40";
  return "bg-white/5 text-[#F6F4F0]/60 ring-white/10";
}

function statusLabel(s: ReviewStatus): string {
  const m: Record<ReviewStatus, string> = {
    pending_review: "검수 대기",
    approved: "승인됨",
    changes_requested: "수정 요청",
    rejected: "반려",
  };
  return m[s];
}

function ratingLabel(r: ContentRating): string {
  const m: Record<ContentRating, string> = { general: "일반", mature: "성인(연령제한)", explicit: "성인(명시적)" };
  return m[r];
}

function formatEdition(r: ReviewRow): string {
  if (r.editionMode === "unique") return "에디션 1/1";
  return `에디션 ${r.initialMint}/${r.editionTotal}`;
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
  `mt-1 w-full rounded-md border px-2.5 py-1.5 text-sm text-[#F6F4F0] outline-none focus:ring-2 focus:ring-[#DEB892]/30 ${
    invalid ? "border-rose-500/50 bg-rose-950/30" : "border-white/15 bg-[#0E0E0E]"
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
      window.alert("미리보기 모드: 실제 검수는 운영자 계정으로 로그인 후 사용하세요.");
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
        window.alert("검수 업데이트에 실패했습니다.");
        return;
      }
      window.location.reload();
    } catch {
      window.alert("검수 업데이트에 실패했습니다.");
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
      window.alert("에디션 설정값이 올바르지 않습니다.");
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
      window.alert("에디션 설정값이 올바르지 않습니다.");
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
      if (!window.confirm("이 작품에 수정을 요청하시겠습니까?")) return;
    }
    if (next.reviewStatus === "rejected" && next.contentRating === "explicit") {
      if (!window.confirm("성인(명시적) 콘텐츠로 반려하시겠습니까?")) return;
    }
    await setReview(r.id, next);
  }

  const assetUrl = (id: string) => `/api/bridge/submissions/${encodeURIComponent(id)}/download`;

  return (
    <div className="mt-8 space-y-6">
      {readOnlyPreview ? (
        <p className="rounded-md border border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#F6F4F0]/60">
          미리보기 모드 — 샘플 데이터만 표시됩니다. 운영자 계정으로 로그인해야 실제 검수가 가능합니다.
        </p>
      ) : null}
      <section className="rounded-lg border border-white/10 bg-[#141414] p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-[#DEB892]/70">대기 목록</p>
        {actionableRows.length === 0 ? (
          <p className="mt-2 text-sm text-[#F6F4F0]/55">검수 대기 중인 작품이 없습니다.</p>
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
                        active ? "border-[#DEB892] ring-2 ring-[#DEB892]/25" : "border-white/10 bg-[#1a1a1a] hover:border-white/20"
                      }`}
                    >
                      <div className="relative aspect-[4/5] w-full bg-[#0E0E0E]">
                        {readOnlyPreview ? (
                          <div className="flex h-full items-center justify-center px-1 text-center text-[0.6rem] text-[#F6F4F0]/40">
                            자산 없음
                          </div>
                        ) : isImage ? (
                          // eslint-disable-next-line @next/next/no-img-element -- dynamic operator asset URLs; avoid Image remotePatterns churn
                          <img src={assetUrl(r.id)} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[0.65rem] text-[#F6F4F0]/40">Video</div>
                        )}
                      </div>
                      <p className="truncate px-2 py-1.5 text-xs text-[#F6F4F0]/85">{r.artworkTitle}</p>
                    </button>
                  </li>
                );
              })}
            </ul>
            {selectedRow && editionDraft ? (
              <div className="mt-4 rounded-lg border border-white/10 bg-[#141414] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-base font-medium text-[#F6F4F0]">{selectedRow.artworkTitle}</h2>
                  {readOnlyPreview ? (
                    <span className="rounded-md border border-white/10 px-3 py-1.5 text-xs text-[#F6F4F0]/40">
                      자산 없음
                    </span>
                  ) : (
                    <a
                      href={assetUrl(selectedRow.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-md border border-white/15 px-3 py-1.5 text-xs font-medium text-[#DEB892] hover:bg-white/5"
                    >
                      원본 열기
                    </a>
                  )}
                </div>
                <p className="mt-1 font-mono text-xs text-[#F6F4F0]/45">{formatEdition(selectedRow)}</p>
                <div className="mt-3 overflow-hidden rounded-md border border-white/10 bg-[#0E0E0E]">
                  {readOnlyPreview ? (
                    <div className="flex min-h-[12rem] items-center justify-center bg-[#1a1a1a] text-sm text-[#F6F4F0]/40">
                      미리보기에서는 자산 표시 불가
                    </div>
                  ) : (selectedRow.mime ?? "").startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element -- dynamic operator asset URLs; avoid Image remotePatterns churn
                    <img src={assetUrl(selectedRow.id)} alt="" className="max-h-[28rem] w-full object-contain" />
                  ) : (
                    <video src={assetUrl(selectedRow.id)} controls className="max-h-[28rem] w-full bg-black" />
                  )}
                </div>

                <div className={`mt-5 rounded-lg border border-white/10 p-4 ${readOnlyPreview ? "opacity-80" : ""}`}>
                  <p className="text-xs font-medium uppercase text-[#DEB892]/70">에디션 설정 (검수 대기 중 수정 가능)</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-[#F6F4F0]/55">모드</p>
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
                          단독 에디션
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
                          한정 에디션
                        </label>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-[#F6F4F0]/55">총 수량</p>
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
                      <p className="text-xs text-[#F6F4F0]/55">최초 발행 수량</p>
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
                      <p className="text-xs text-[#F6F4F0]/55">번호 부여</p>
                      <select
                        name="numberingPolicy"
                        value={editionDraft.numberingPolicy}
                        onChange={onEditionText}
                        className={inputCls(false)}
                        disabled={readOnlyPreview}
                      >
                        <option value="auto">자동</option>
                        <option value="manual">수동</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="flex gap-2 text-sm text-[#F6F4F0]/80">
                        <input
                          type="checkbox"
                          name="lockEdition"
                          checked={editionDraft.lockEdition}
                          onChange={onEditionCheckbox}
                          disabled={readOnlyPreview}
                        />
                        승인 후 에디션 잠금
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-xs text-[#F6F4F0]/55">작가에게 전달할 메모 (반려 / 수정 요청 시)</p>
                  <textarea
                    value={reviewNoteDraft}
                    onChange={(e) => setReviewNoteDraft(e.target.value)}
                    rows={3}
                    maxLength={800}
                    disabled={readOnlyPreview}
                    className="mt-1 w-full rounded-md border border-white/15 bg-[#0E0E0E] px-3 py-2 text-sm text-[#F6F4F0] outline-none focus:ring-2 focus:ring-[#DEB892]/30 disabled:opacity-50"
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={readOnlyPreview || pending === selectedRow.id}
                    onClick={() => void applyReviewFromPanel({ reviewStatus: "approved", contentRating: "general" })}
                    className="rounded-md bg-[#DEB892] px-3 py-2 text-xs font-medium text-[#1a1510] hover:bg-[#e8c9a0] disabled:opacity-50"
                  >
                    승인 (일반)
                  </button>
                  <button
                    type="button"
                    disabled={readOnlyPreview || pending === selectedRow.id}
                    onClick={() => void applyReviewFromPanel({ reviewStatus: "approved", contentRating: "mature" })}
                    className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-[#F6F4F0]/80 hover:bg-white/10 disabled:opacity-50"
                  >
                    승인 (연령제한)
                  </button>
                  <button
                    type="button"
                    disabled={readOnlyPreview || pending === selectedRow.id}
                    onClick={() => void applyRequestChangesFromPanel()}
                    className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900 hover:bg-amber-100 disabled:opacity-50"
                  >
                    수정 요청
                  </button>
                  <button
                    type="button"
                    disabled={readOnlyPreview || pending === selectedRow.id}
                    onClick={() => void applyReviewFromPanel({ reviewStatus: "rejected", contentRating: "explicit" })}
                    className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-900 hover:bg-rose-100 disabled:opacity-50"
                  >
                    반려 (성인 콘텐츠)
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-medium uppercase text-[#DEB892]/70">필터</span>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as ReviewStatus | "all")}
          className="rounded-md border border-white/15 bg-[#0E0E0E] px-3 py-2 text-sm text-[#F6F4F0]"
        >
          <option value="pending_review">검수 대기</option>
          <option value="approved">승인됨</option>
          <option value="changes_requested">수정 요청</option>
          <option value="rejected">반려</option>
          <option value="all">전체</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border border-white/10 shadow-sm">
        <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto_auto_minmax(0,1.2fr)] gap-3 border-b border-white/10 bg-[#141414] px-4 py-3 text-xs font-medium text-[#DEB892]/70">
          <span>작품</span>
          <span>작가</span>
          <span>상태</span>
          <span>등급</span>
          <span>액션</span>
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
                  <p className="truncate font-medium text-[#F6F4F0]">{r.artworkTitle}</p>
                  {typeof r.priceJpy === "number" ? (
                    <p className="mt-0.5 font-mono text-xs text-[#F6F4F0]/45">¥{r.priceJpy.toLocaleString("ja-JP")}</p>
                  ) : null}
                  <p className="mt-0.5 font-mono text-xs text-[#F6F4F0]/35">{formatEdition(r)}</p>
                  <p className="font-mono text-xs text-[#F6F4F0]/35">{r.id}</p>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[#F6F4F0]/80">{r.nickname}</p>
                  <p className="font-mono text-xs text-[#F6F4F0]/35">{r.artistId}</p>
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
                    className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-[#F6F4F0]/80 hover:bg-white/10 disabled:opacity-50"
                  >
                    승인
                  </button>
                  <button
                    type="button"
                    disabled={readOnlyPreview || busy}
                    onClick={() => void applyReviewFromTable(r, { reviewStatus: "approved", contentRating: "mature" })}
                    className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-[#F6F4F0]/80 hover:bg-white/10 disabled:opacity-50"
                  >
                    연령제한 승인
                  </button>
                  <button
                    type="button"
                    disabled={readOnlyPreview || busy || !canRequestChanges}
                    onClick={() =>
                      void applyReviewFromTable(r, { reviewStatus: "changes_requested", contentRating: r.contentRating })
                    }
                    className="rounded border border-amber-700/40 bg-amber-950/40 px-2 py-1 text-xs text-amber-300 disabled:opacity-50"
                  >
                    수정 요청
                  </button>
                  <button
                    type="button"
                    disabled={readOnlyPreview || busy}
                    onClick={() => void applyReviewFromTable(r, { reviewStatus: "rejected", contentRating: "explicit" })}
                    className="rounded border border-rose-700/40 bg-rose-950/40 px-2 py-1 text-xs text-rose-300 disabled:opacity-50"
                  >
                    반려
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
