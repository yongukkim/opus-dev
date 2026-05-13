"use client";

import { useEffect, useId, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/types";
import type { VaultUiRole } from "@/lib/vaultRole";
import type { TransferRegisterLockedWork } from "@/lib/transferRegisterLockedWork";
import { COLLECTOR_TRANSFER_GENRES, OPUS_ARTWORK_GENRE_KEYS, type OpusArtworkGenreKey } from "@/lib/opusArtworkGenres";
import { opusArtworkGenreLabel } from "@/lib/artworkGenreDisplay";
import { genreQuickKeywordsForLocale } from "@/lib/genreQuickKeywords";
import { GenreKeywordQuickPick } from "@/components/forms/GenreKeywordQuickPick";
import Link from "next/link";
import { withLocale } from "@/i18n/paths";

type Genre = "" | OpusArtworkGenreKey;

type Draft = {
  userId: string;
  artistLegalName: string;
  artistPenName: string;
  artworkTitle: string;
  genre: Genre;
  year: string;
  description: string;
  tags: string;
  editionRef: string;
  priceJpy: string;
  auctionEndAtLocal: string;
  auctionReservePriceJpy: string;
  auctionBuyoutPriceJpy: string;
  auctionMinIncrementJpy: string;
  auctionAntiSnipingPreset: "off" | "5_1" | "10_3" | "15_5";
  auctionShowSummary: boolean;
  note: string;
  rightsConfirmed: boolean;
};

function initialDraft(
  locked: TransferRegisterLockedWork | null | undefined,
  sessionUserId: string | undefined,
): Draft {
  const uid = sessionUserId?.trim() || "collector-demo-001";
  const oneWeekLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const defaultEndAtLocal = new Date(
    oneWeekLater.getTime() - oneWeekLater.getTimezoneOffset() * 60_000,
  )
    .toISOString()
    .slice(0, 16);
  if (!locked) {
    return {
      userId: uid,
      artistLegalName: "",
      artistPenName: "",
      artworkTitle: "",
      genre: "",
      year: "",
      description: "",
      tags: "",
      editionRef: "",
      priceJpy: "",
      auctionEndAtLocal: defaultEndAtLocal,
      auctionReservePriceJpy: "",
      auctionBuyoutPriceJpy: "",
      auctionMinIncrementJpy: "",
      auctionAntiSnipingPreset: "10_3",
      auctionShowSummary: true,
      note: "",
      rightsConfirmed: false,
    };
  }
  return {
    userId: uid,
    artistLegalName: locked.artistLegalNameRedacted ? "" : locked.artistLegalName,
    artistPenName: locked.artistPenName,
    artworkTitle: locked.artworkTitle,
    genre: (() => {
      const g = locked.genre?.trim() ?? "";
      return (COLLECTOR_TRANSFER_GENRES.has(g) ? g : "illustration") as Genre;
    })(),
    year: locked.year,
    description: locked.description,
    tags: locked.tags,
    editionRef: locked.editionRef,
    priceJpy: "",
    auctionEndAtLocal: defaultEndAtLocal,
    auctionReservePriceJpy: "",
    auctionBuyoutPriceJpy: "",
    auctionMinIncrementJpy: "",
    auctionAntiSnipingPreset: "10_3",
    auctionShowSummary: true,
    note: "",
    rightsConfirmed: false,
  };
}

function inputClass(invalid: boolean): string {
  return `w-full rounded-md border bg-black/20 px-3 py-2 font-sans text-sm text-opus-warm/85 outline-none transition ${
    invalid
      ? "border-red-400/35 focus:border-red-300/55"
      : "border-white/[0.12] focus:border-opus-gold/45"
  }`;
}

function readonlyBlockClass(): string {
  return "mt-2 rounded-md border border-white/[0.12] bg-black/20 px-3 py-2 text-sm text-opus-warm/80";
}

function labelClass(): string {
  return "font-mono text-[0.65rem] uppercase tracking-[0.22em] text-opus-warm/50";
}

function hintClass(): string {
  return "mt-2 text-xs leading-relaxed text-opus-warm/45";
}

function sectionRule(title: string) {
  return (
    <div className="mt-8 border-t border-white/[0.08] pt-6">
      <p className="opus-text-metallic-soft font-mono text-[0.65rem] uppercase tracking-[0.24em]">{title}</p>
    </div>
  );
}

export function CollectorTransferRegisterForm({
  locale,
  m,
  vaultRole,
  lockedWork = null,
  sessionUserId,
  artistPrimaryInventory = false,
}: {
  locale: Locale;
  m: Messages;
  vaultRole: VaultUiRole;
  lockedWork?: TransferRegisterLockedWork | null;
  sessionUserId?: string;
  artistPrimaryInventory?: boolean;
}) {
  const t = m.collectorTransfer;
  const apiRole = vaultRole === "artist" ? "artist" : "collector";
  const saleModeRadioName = useId();
  const artworkLocked = Boolean(lockedWork);

  const [saleMode, setSaleMode] = useState<"fixed" | "auction">("fixed");

  const [draft, setDraft] = useState<Draft>(() => initialDraft(lockedWork, sessionUserId));

  const [touched, setTouched] = useState<Partial<Record<keyof Draft, boolean>>>({});
  const [banner, setBanner] = useState<"ok" | "err" | string | null>(null);
  const [errorModalMessage, setErrorModalMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [previewThumbFailed, setPreviewThumbFailed] = useState(false);

  useEffect(() => {
    setPreviewThumbFailed(false);
  }, [lockedWork?.submissionId]);

  function mapClientValidationError(
    errs: Partial<Record<keyof Draft, string>>,
  ): string {
    if (errs.priceJpy) return t.transferRegisterApiInvalidPrice;
    if (errs.auctionEndAtLocal) return t.transferRegisterApiInvalidAuctionEndAt;
    if (errs.auctionReservePriceJpy) return t.transferRegisterApiInvalidAuctionReserve;
    if (errs.auctionBuyoutPriceJpy) return t.transferRegisterApiInvalidAuctionBuyout;
    if (errs.auctionMinIncrementJpy) return t.transferRegisterApiInvalidAuctionIncrement;
    if (errs.rightsConfirmed) return t.transferRegisterApiInvalidRightsConfirm;
    return t.errorBanner;
  }

  function mapApiErrorToBanner(error: string | undefined): string {
    if (!error) return t.errorBanner;
    if (error === "submission_required") return t.transferRegisterApiSubmissionRequired;
    if (error === "forbidden_submission") return t.transferRegisterApiForbiddenSubmission;
    if (error === "own_primary_inventory") return t.transferRegisterApiOwnPrimaryInventory;
    if (error === "unauthorized") return "로그인이 만료되었습니다. 다시 로그인해 주세요.";
    if (error === "invalid_request") return "요청 형식 검증에 실패했습니다. 입력값을 다시 확인해 주세요.";
    if (error === "invalid:auctionEndAt") return t.transferRegisterApiInvalidAuctionEndAt;
    if (error === "invalid:auctionReservePriceJpy") return t.transferRegisterApiInvalidAuctionReserve;
    if (error === "invalid:auctionBuyoutPriceJpy") return t.transferRegisterApiInvalidAuctionBuyout;
    if (error === "invalid:auctionMinIncrementJpy") return t.transferRegisterApiInvalidAuctionIncrement;
    if (error === "invalid:auctionAntiSnipingTriggerMinutes" || error === "invalid:auctionAntiSnipingExtendMinutes") {
      return t.transferRegisterApiInvalidAuctionAntiSniping;
    }
    if (error === "invalid:priceJpy") return t.transferRegisterApiInvalidPrice;
    if (error === "invalid:rightsConfirmed") return t.transferRegisterApiInvalidRightsConfirm;
    return `${t.errorBanner} (${error})`;
  }

  const genreQuickKeywords = useMemo(() => [...genreQuickKeywordsForLocale(locale)], [locale]);

  const errors = useMemo(() => {
    if (artistPrimaryInventory) return {};
    const e: Partial<Record<keyof Draft, string>> = {};
    if (!artworkLocked) {
      if (!draft.artistPenName.trim()) e.artistPenName = "Required";
      if (!draft.artworkTitle.trim()) e.artworkTitle = "Required";
      if (!draft.genre) e.genre = "Required";

      if (draft.year.trim()) {
        const y = Number.parseInt(draft.year, 10);
        const current = new Date().getFullYear();
        if (!Number.isFinite(y) || y < 1900 || y > current + 1) e.year = "Invalid";
      }
    }

    const priceParsed = Number.parseInt(draft.priceJpy, 10);
    if (!draft.priceJpy.trim() || !Number.isFinite(priceParsed) || priceParsed < 1 || priceParsed > 99_999_999) {
      e.priceJpy = "Invalid";
    }

    if (saleMode === "auction") {
      const endRaw = draft.auctionEndAtLocal.trim();
      const endDate = endRaw ? new Date(endRaw) : null;
      const now = Date.now();
      const maxMs = 30 * 24 * 60 * 60 * 1000;
      if (!endDate || !Number.isFinite(endDate.getTime()) || endDate.getTime() <= now || endDate.getTime() - now > maxMs) {
        e.auctionEndAtLocal = "Invalid";
      }

      const reserve = draft.auctionReservePriceJpy.trim()
        ? Number.parseInt(draft.auctionReservePriceJpy, 10)
        : undefined;
      if (reserve !== undefined && (!Number.isFinite(reserve) || reserve < priceParsed)) {
        e.auctionReservePriceJpy = "Invalid";
      }

      const buyout = draft.auctionBuyoutPriceJpy.trim()
        ? Number.parseInt(draft.auctionBuyoutPriceJpy, 10)
        : undefined;
      if (buyout !== undefined && (!Number.isFinite(buyout) || buyout <= priceParsed)) {
        e.auctionBuyoutPriceJpy = "Invalid";
      }

      const inc = draft.auctionMinIncrementJpy.trim()
        ? Number.parseInt(draft.auctionMinIncrementJpy, 10)
        : undefined;
      if (inc !== undefined && (!Number.isFinite(inc) || inc < 1)) {
        e.auctionMinIncrementJpy = "Invalid";
      }
    }

    if (!draft.rightsConfirmed) e.rightsConfirmed = "Confirm required";

    return e;
  }, [draft, artworkLocked, saleMode, artistPrimaryInventory]);

  const hasErrors = Object.keys(errors).length > 0;

  function markTouched(name: keyof Draft) {
    setTouched((prev) => ({ ...prev, [name]: true }));
  }

  function onText(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    if (
      artworkLocked &&
      name !== "priceJpy" &&
      name !== "note" &&
      name !== "auctionEndAtLocal" &&
      name !== "auctionReservePriceJpy" &&
      name !== "auctionBuyoutPriceJpy" &&
      name !== "auctionMinIncrementJpy" &&
      name !== "auctionAntiSnipingPreset"
    ) {
      return;
    }
    if (name === "priceJpy") {
      setDraft((d) => ({ ...d, priceJpy: value.replace(/\D/g, "").slice(0, 8) }));
      return;
    }
    if (
      name === "auctionReservePriceJpy" ||
      name === "auctionBuyoutPriceJpy" ||
      name === "auctionMinIncrementJpy"
    ) {
      setDraft((d) => ({ ...d, [name]: value.replace(/\D/g, "").slice(0, 8) } as Draft));
      return;
    }
    setDraft((d) => ({ ...d, [name]: value } as Draft));
  }

  function onCheckbox(e: ChangeEvent<HTMLInputElement>) {
    const { name, checked } = e.target;
    if (name === "auctionShowSummary") {
      setDraft((d) => ({ ...d, auctionShowSummary: checked }));
      return;
    }
    setDraft((d) => ({ ...d, rightsConfirmed: checked }));
  }

  function onSaveDraft() {
    setBanner(t.saveDraft + " — UI only.");
    window.setTimeout(() => setBanner(null), 2200);
  }

  const invalid = (k: keyof Draft) => Boolean((touched[k] || banner === "err") && errors[k]);

  const preview = useMemo(() => {
    const safe = (s: string, fb: string) => (s.trim() ? s.trim() : fb);
    const genreLabel = draft.genre ? opusArtworkGenreLabel(t, draft.genre) : "—";
    const priceJpyDisplay = draft.priceJpy.trim()
      ? `¥${Number(draft.priceJpy).toLocaleString("ja-JP")}`
      : "—";
    const saleModeLabel =
      saleMode === "auction" ? t.listingsSaleModeAuction : t.listingsSaleModeFixed;
    const auctionSummary =
      saleMode === "auction" && draft.auctionShowSummary
        ? (() => {
            const starting = draft.priceJpy.trim()
              ? `¥${Number(draft.priceJpy).toLocaleString("ja-JP")}`
              : "—";
            const reserve = draft.auctionReservePriceJpy.trim()
              ? `¥${Number(draft.auctionReservePriceJpy).toLocaleString("ja-JP")}`
              : "";
            const buyout = draft.auctionBuyoutPriceJpy.trim()
              ? `¥${Number(draft.auctionBuyoutPriceJpy).toLocaleString("ja-JP")}`
              : "";
            const inc = draft.auctionMinIncrementJpy.trim()
              ? `¥${Number(draft.auctionMinIncrementJpy).toLocaleString("ja-JP")}`
              : "";
            const endAt =
              draft.auctionEndAtLocal.trim() && Number.isFinite(new Date(draft.auctionEndAtLocal).getTime())
                ? new Date(draft.auctionEndAtLocal).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" })
                : "—";
            const parts = [
              `${t.auctionSummaryStarting} ${starting}`,
              reserve ? `${t.auctionSummaryReserve} ${reserve}` : "",
              buyout ? `${t.auctionSummaryBuyout} ${buyout}` : "",
              inc ? `${t.auctionSummaryMinIncrement} +${inc}` : "",
              `${t.auctionSummaryEnds} ${endAt}`,
            ].filter(Boolean);
            return parts.join(" · ");
          })()
        : null;
    const tagList = draft.tags
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 8);
    return {
      penName: safe(draft.artistPenName, "—"),
      title: safe(draft.artworkTitle, "—"),
      genreLabel,
      year: draft.year.trim() || "—",
      editionRef: draft.editionRef.trim() || "—",
      priceJpyDisplay,
      saleModeLabel,
      auctionSummary,
      tags: tagList,
      description: draft.description.trim(),
    };
  }, [draft, saleMode, t, locale]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (artistPrimaryInventory) return;

    /**
     * ISO 27001 A.14.2.1 (§1)
     * KO: 클라이언트는 편의용 검증만 하며, 최종 검증은 API에서 수행합니다.
     * JA: クライアントは便宜上の検証のみとし、最終検証はAPIで行います。
     * EN: Client checks are advisory; the API performs authoritative validation.
     */
    setTouched(
      artworkLocked
        ? {
            priceJpy: true,
            auctionEndAtLocal: true,
            auctionReservePriceJpy: true,
            auctionBuyoutPriceJpy: true,
            auctionMinIncrementJpy: true,
            note: true,
            rightsConfirmed: true,
          }
        : {
            userId: true,
            artistLegalName: true,
            artistPenName: true,
            artworkTitle: true,
            genre: true,
            year: true,
            description: true,
            tags: true,
            editionRef: true,
            priceJpy: true,
            auctionEndAtLocal: true,
            auctionReservePriceJpy: true,
            auctionBuyoutPriceJpy: true,
            auctionMinIncrementJpy: true,
            note: true,
            rightsConfirmed: true,
          },
    );

    if (!draft.rightsConfirmed) {
      window.alert(t.consentRequiredAlert);
      return;
    }

    if (hasErrors) {
      setErrorModalMessage(mapClientValidationError(errors));
      return;
    }

    const price = Number.parseInt(draft.priceJpy, 10);
    setPending(true);
    setBanner(null);
    try {
      const fd = new FormData();
      if (lockedWork) {
        fd.set("submissionId", lockedWork.submissionId);
      } else {
        fd.set("artistLegalName", draft.artistLegalName.trim());
        fd.set("artistPenName", draft.artistPenName.trim());
        fd.set("artworkTitle", draft.artworkTitle.trim());
        fd.set("genre", draft.genre);
        fd.set("year", draft.year.trim());
        fd.set("description", draft.description.trim());
        fd.set("tags", draft.tags.trim());
        fd.set("editionRef", draft.editionRef.trim());
      }
      fd.set("priceJpy", String(price));
      fd.set("saleMode", saleMode);
      if (saleMode === "auction") {
        const endAtIso = new Date(draft.auctionEndAtLocal).toISOString();
        fd.set("auctionEndAt", endAtIso);
        if (draft.auctionReservePriceJpy.trim()) fd.set("auctionReservePriceJpy", draft.auctionReservePriceJpy.trim());
        if (draft.auctionBuyoutPriceJpy.trim()) fd.set("auctionBuyoutPriceJpy", draft.auctionBuyoutPriceJpy.trim());
        if (draft.auctionMinIncrementJpy.trim())
          fd.set("auctionMinIncrementJpy", draft.auctionMinIncrementJpy.trim());
        if (draft.auctionAntiSnipingPreset !== "off") {
          const [trigger, extend] = draft.auctionAntiSnipingPreset.split("_") as [string, string];
          fd.set("auctionAntiSnipingTriggerMinutes", trigger);
          fd.set("auctionAntiSnipingExtendMinutes", extend);
        }
        fd.set("auctionShowSummary", draft.auctionShowSummary ? "true" : "false");
      }
      fd.set("note", draft.note.trim());
      fd.set("rightsConfirmed", "true");

      const res = await fetch("/api/collector-transfer-listings", {
        method: "POST",
        body: fd,
        headers: {
          "x-opus-user-id": draft.userId.trim(),
          "x-opus-role": apiRole,
        },
      });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setErrorModalMessage(mapApiErrorToBanner(body.error));
        return;
      }
      setBanner("ok");
      setSaleMode("fixed");
      setDraft((d) =>
        lockedWork
          ? {
              ...d,
              priceJpy: "",
              auctionReservePriceJpy: "",
              auctionBuyoutPriceJpy: "",
              auctionMinIncrementJpy: "",
              note: "",
              rightsConfirmed: false,
            }
          : {
              ...d,
              artistLegalName: "",
              artistPenName: "",
              artworkTitle: "",
              genre: "",
              year: "",
              description: "",
              tags: "",
              editionRef: "",
              priceJpy: "",
              auctionReservePriceJpy: "",
              auctionBuyoutPriceJpy: "",
              auctionMinIncrementJpy: "",
              note: "",
              rightsConfirmed: false,
            },
      );
      setTouched({});
    } catch {
      setErrorModalMessage(t.errorBanner);
    } finally {
      setPending(false);
    }
  }

  const listingsHref = withLocale(locale, "/provenance");

  return (
    <div className="mt-10 grid gap-6 lg:grid-cols-[1.25fr,0.75fr]">
      <form
        onSubmit={onSubmit}
        className="rounded-xl border border-white/[0.08] bg-opus-slate/20 p-5 shadow-opus-card md:p-6"
      >
        {banner === "ok" ? (
          <div
            className="mb-5 rounded-lg border border-opus-gold/25 bg-opus-gold/10 px-4 py-3 text-sm text-opus-warm/80"
            role="status"
          >
            {t.successBanner}{" "}
            <Link href={listingsHref} className="text-opus-gold underline-offset-4 hover:underline">
              →
            </Link>
          </div>
        ) : null}
        {typeof banner === "string" && banner !== "ok" && banner !== "err" ? (
          <div className="mb-5 rounded-lg border border-white/[0.10] bg-black/25 px-4 py-3 text-sm text-opus-warm/70">
            {banner}
          </div>
        ) : null}

        {!artworkLocked ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <p className={labelClass()}>{t.userIdDevLabel}</p>
              <input
                name="userId"
                value={draft.userId}
                onChange={onText}
                className={`${inputClass(false)} mt-2`}
                autoComplete="off"
              />
              <p className={hintClass()}>{t.userIdDevHint}</p>
            </div>
          </div>
        ) : null}

        {artistPrimaryInventory && lockedWork ? (
          <div className="mb-6 rounded-lg border border-opus-gold/22 bg-opus-gold/[0.07] px-4 py-5 text-sm leading-relaxed text-opus-warm/80">
            <p className="opus-text-metallic-soft font-mono text-[0.65rem] uppercase tracking-[0.22em] text-opus-gold/90">
              {t.transferRegisterArtistPrimaryModeTitle}
            </p>
            <p className="mt-3">{t.transferRegisterArtistPrimaryModeBody}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={withLocale(locale, "/vault/my-artworks")}
                className="opus-surface-metallic inline-flex items-center justify-center rounded-md px-4 py-2 text-xs font-semibold text-opus-charcoal transition hover:opacity-95"
              >
                {m.vaultNav.myArtworks}
              </Link>
              <Link
                href={withLocale(locale, `/vault/my-artworks/${encodeURIComponent(lockedWork.submissionId)}/edit`)}
                className="inline-flex items-center justify-center rounded-md border border-opus-gold/40 px-4 py-2 text-xs font-semibold text-opus-gold-light transition hover:border-opus-gold-light/60 hover:bg-opus-gold/10"
              >
                {t.transferRegisterArtistPrimaryEditionCta}
              </Link>
            </div>
            <p className="mt-4 text-xs text-opus-warm/50">{t.transferRegisterWorkLockedHint}</p>
          </div>
        ) : null}

        {!artistPrimaryInventory ? (
          <>
        {sectionRule(t.sectionSaleMode)}
        <div className="mt-4" role="radiogroup" aria-label={t.sectionSaleMode}>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label
              className={`grid w-full min-w-0 cursor-pointer grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5 rounded-lg border p-4 text-left font-sans transition ${
                saleMode === "fixed"
                  ? "border-opus-gold/50 bg-opus-gold/[0.12]"
                  : "border-white/[0.14] bg-opus-slate/25 hover:border-opus-gold/30"
              }`}
            >
              <input
                type="radio"
                name={saleModeRadioName}
                value="fixed"
                checked={saleMode === "fixed"}
                onChange={() => setSaleMode("fixed")}
                className="row-span-2 mt-1 h-4 w-4 shrink-0 self-start border-white/[0.35] bg-opus-charcoal accent-opus-gold focus:ring-1 focus:ring-opus-gold/40"
              />
              <span
                className="min-w-0 text-sm font-semibold leading-snug tracking-tight text-[#f6f4f0]"
                style={{ color: "#f6f4f0", WebkitTextFillColor: "#f6f4f0" }}
              >
                {t.saleModeFixedLabel}
              </span>
              <span
                className="min-w-0 text-xs leading-relaxed text-[#c9c3b8]"
                style={{ color: "#c9c3b8", WebkitTextFillColor: "#c9c3b8" }}
              >
                {t.saleModeFixedDescription}
              </span>
            </label>
            <label
              className={`grid w-full min-w-0 cursor-pointer grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5 rounded-lg border p-4 text-left font-sans transition ${
                saleMode === "auction"
                  ? "border-opus-gold/50 bg-opus-gold/[0.12]"
                  : "border-white/[0.14] bg-opus-slate/25 hover:border-opus-gold/30"
              }`}
            >
              <input
                type="radio"
                name={saleModeRadioName}
                value="auction"
                checked={saleMode === "auction"}
                onChange={() => setSaleMode("auction")}
                className="row-span-2 mt-1 h-4 w-4 shrink-0 self-start border-white/[0.35] bg-opus-charcoal accent-opus-gold focus:ring-1 focus:ring-opus-gold/40"
              />
              <span
                className="min-w-0 text-sm font-semibold leading-snug tracking-tight text-[#f6f4f0]"
                style={{ color: "#f6f4f0", WebkitTextFillColor: "#f6f4f0" }}
              >
                {t.saleModeAuctionLabel}
              </span>
              <span
                className="min-w-0 text-xs leading-relaxed text-[#c9c3b8]"
                style={{ color: "#c9c3b8", WebkitTextFillColor: "#c9c3b8" }}
              >
                {t.saleModeAuctionDescription}
              </span>
            </label>
          </div>
        </div>

        {sectionRule(t.sectionArtist)}
        {artworkLocked ? (
          <p className="mt-4 rounded-lg border border-opus-gold/18 bg-opus-gold/[0.06] px-4 py-3 text-xs leading-relaxed text-opus-warm/70">
            {t.transferRegisterWorkLockedHint}
          </p>
        ) : null}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {!artworkLocked ? (
            <div>
              <p className={labelClass()}>{t.artistLegalNameLabel}</p>
              <input
                name="artistLegalName"
                value={draft.artistLegalName}
                onChange={onText}
                onBlur={() => markTouched("artistLegalName")}
                className={`${inputClass(false)} mt-2`}
                autoComplete="off"
              />
              <p className={hintClass()}>{t.artistLegalNameHint}</p>
            </div>
          ) : null}
          <div>
            <p className={labelClass()}>{t.artistPenNameLabel}</p>
            {artworkLocked ? (
              <p className={readonlyBlockClass()}>{draft.artistPenName.trim() || "—"}</p>
            ) : (
              <>
                <input
                  name="artistPenName"
                  value={draft.artistPenName}
                  onChange={onText}
                  onBlur={() => markTouched("artistPenName")}
                  className={`${inputClass(invalid("artistPenName"))} mt-2`}
                  autoComplete="off"
                />
                {invalid("artistPenName") ? <p className="mt-1 text-xs text-red-300/70">Required</p> : null}
              </>
            )}
            <p className={hintClass()}>{t.artistPenNameHint}</p>
          </div>
        </div>

        {sectionRule(t.sectionWork)}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <p className={labelClass()}>{t.artworkTitleLabel}</p>
            <input
              name="artworkTitle"
              value={draft.artworkTitle}
              onChange={onText}
              onBlur={() => markTouched("artworkTitle")}
              readOnly={artworkLocked}
              className={`${inputClass(invalid("artworkTitle"))} mt-2`}
            />
            {invalid("artworkTitle") ? <p className="mt-1 text-xs text-red-300/70">Required</p> : null}
          </div>

          <div>
            <p className={labelClass()}>{t.genreLabel}</p>
            <select
              name="genre"
              value={draft.genre}
              onChange={onText}
              onBlur={() => markTouched("genre")}
              disabled={artworkLocked}
              className={`${inputClass(invalid("genre"))} mt-2`}
            >
              <option value="">{t.genrePlaceholder}</option>
              {OPUS_ARTWORK_GENRE_KEYS.map((key) => (
                <option key={key} value={key}>
                  {opusArtworkGenreLabel(t, key)}
                </option>
              ))}
            </select>
            {invalid("genre") ? <p className="mt-1 text-xs text-red-300/70">Required</p> : null}
            <GenreKeywordQuickPick
              label={t.genreKeywordsLabel}
              hint={t.genreKeywordsHint}
              keywords={genreQuickKeywords}
              tags={draft.tags}
              disabled={artworkLocked}
              onTagsChange={(next) => {
                setDraft((d) => ({ ...d, tags: next }));
                markTouched("tags");
              }}
            />
          </div>

          <div>
            <p className={labelClass()}>{t.yearLabel}</p>
            <input
              name="year"
              value={draft.year}
              onChange={onText}
              onBlur={() => markTouched("year")}
              readOnly={artworkLocked}
              className={`${inputClass(invalid("year"))} mt-2`}
              inputMode="numeric"
              placeholder="2026"
            />
            <p className={hintClass()}>{t.yearHint}</p>
            {invalid("year") ? <p className="mt-1 text-xs text-red-300/70">Invalid</p> : null}
          </div>

          <div className="md:col-span-2">
            <p className={labelClass()}>{t.descriptionLabel}</p>
            <textarea
              name="description"
              value={draft.description}
              onChange={onText}
              onBlur={() => markTouched("description")}
              readOnly={artworkLocked}
              className={`${inputClass(false)} mt-2 min-h-28 resize-y`}
            />
          </div>

          <div>
            <p className={labelClass()}>{t.tagsLabel}</p>
            <input
              name="tags"
              value={draft.tags}
              onChange={onText}
              onBlur={() => markTouched("tags")}
              readOnly={artworkLocked}
              className={`${inputClass(false)} mt-2`}
              placeholder="abstract, monochrome"
            />
            <p className={hintClass()}>{t.tagsHint}</p>
          </div>

          <div>
            <p className={labelClass()}>{t.editionRefLabel}</p>
            <input
              name="editionRef"
              value={draft.editionRef}
              onChange={onText}
              onBlur={() => markTouched("editionRef")}
              readOnly={artworkLocked}
              className={`${inputClass(false)} mt-2`}
            />
            <p className={hintClass()}>{t.editionRefHint}</p>
          </div>
        </div>

        {sectionRule(t.sectionOffer)}
        <div className="mt-6 max-w-md">
          <p className={labelClass()}>
            {saleMode === "auction" ? t.priceLabelAuction : t.priceLabelFixed}
          </p>
          <input
            name="priceJpy"
            value={draft.priceJpy}
            onChange={onText}
            onBlur={() => markTouched("priceJpy")}
            className={`${inputClass(invalid("priceJpy"))} mt-2`}
            inputMode="numeric"
            autoComplete="off"
            placeholder="10000"
          />
          <p className={hintClass()}>
            {saleMode === "auction" ? t.priceHintAuction : t.priceHintFixed}
          </p>
          {invalid("priceJpy") ? <p className="mt-1 text-xs text-red-300/70">Invalid</p> : null}
        </div>

        {saleMode === "auction" ? (
          <div className="mt-6">
            <p className={labelClass()}>{t.auctionOptionsTitle}</p>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <p className={labelClass()}>{t.auctionEndAtLabel}</p>
                <input
                  type="datetime-local"
                  name="auctionEndAtLocal"
                  value={draft.auctionEndAtLocal}
                  onChange={onText}
                  onBlur={() => markTouched("auctionEndAtLocal")}
                  className={`${inputClass(invalid("auctionEndAtLocal"))} mt-2`}
                />
                <p className={hintClass()}>{t.auctionEndAtHint}</p>
                {invalid("auctionEndAtLocal") ? <p className="mt-1 text-xs text-red-300/70">Invalid</p> : null}
              </div>

              <div>
                <p className={labelClass()}>{t.auctionReservePriceLabel}</p>
                <input
                  name="auctionReservePriceJpy"
                  value={draft.auctionReservePriceJpy}
                  onChange={onText}
                  onBlur={() => markTouched("auctionReservePriceJpy")}
                  className={`${inputClass(invalid("auctionReservePriceJpy"))} mt-2`}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="20000"
                />
                <p className={hintClass()}>{t.auctionReservePriceHint}</p>
                {invalid("auctionReservePriceJpy") ? <p className="mt-1 text-xs text-red-300/70">Invalid</p> : null}
              </div>

              <div>
                <p className={labelClass()}>{t.auctionBuyoutPriceLabel}</p>
                <input
                  name="auctionBuyoutPriceJpy"
                  value={draft.auctionBuyoutPriceJpy}
                  onChange={onText}
                  onBlur={() => markTouched("auctionBuyoutPriceJpy")}
                  className={`${inputClass(invalid("auctionBuyoutPriceJpy"))} mt-2`}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="50000"
                />
                <p className={hintClass()}>{t.auctionBuyoutPriceHint}</p>
                {invalid("auctionBuyoutPriceJpy") ? <p className="mt-1 text-xs text-red-300/70">Invalid</p> : null}
              </div>

              <div>
                <p className={labelClass()}>{t.auctionMinIncrementLabel}</p>
                <input
                  name="auctionMinIncrementJpy"
                  value={draft.auctionMinIncrementJpy}
                  onChange={onText}
                  onBlur={() => markTouched("auctionMinIncrementJpy")}
                  className={`${inputClass(invalid("auctionMinIncrementJpy"))} mt-2`}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="1000"
                />
                <p className={hintClass()}>{t.auctionMinIncrementHint}</p>
                {invalid("auctionMinIncrementJpy") ? <p className="mt-1 text-xs text-red-300/70">Invalid</p> : null}
              </div>

              <div>
                <p className={labelClass()}>{t.auctionAntiSnipingLabel}</p>
                <select
                  name="auctionAntiSnipingPreset"
                  value={draft.auctionAntiSnipingPreset}
                  onChange={onText}
                  className={`${inputClass(false)} mt-2`}
                >
                  <option value="off">{t.auctionAntiSnipingOptOff}</option>
                  <option value="5_1">{t.auctionAntiSnipingOpt5_1}</option>
                  <option value="10_3">{t.auctionAntiSnipingOpt10_3}</option>
                  <option value="15_5">{t.auctionAntiSnipingOpt15_5}</option>
                </select>
                <p className={hintClass()}>{t.auctionAntiSnipingHint}</p>
              </div>

              <div className="md:col-span-2 rounded-lg border border-white/[0.08] bg-black/10 p-4">
                <p className={labelClass()}>{t.auctionVisibilityLabel}</p>
                <label className="mt-3 flex gap-3 text-sm text-opus-warm/75">
                  <input
                    type="checkbox"
                    name="auctionShowSummary"
                    checked={draft.auctionShowSummary}
                    onChange={onCheckbox}
                    className="mt-1 h-4 w-4 rounded border-white/[0.25] bg-black/30 text-opus-gold focus:ring-0"
                  />
                  <span className="leading-relaxed">{t.auctionVisibilityShowSummary}</span>
                </label>
                <p className={hintClass()}>{t.auctionVisibilityHint}</p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-5">
          <p className={labelClass()}>{t.noteLabel}</p>
          <textarea
            name="note"
            value={draft.note}
            onChange={onText}
            onBlur={() => markTouched("note")}
            className={`${inputClass(false)} mt-2 min-h-24 resize-y`}
          />
          <p className={hintClass()}>{t.noteHint}</p>
        </div>

        <div className="mt-6 rounded-lg border border-white/[0.08] bg-black/15 p-4">
          <p className={labelClass()}>{t.rightsConfirmLabel}</p>
          <label className="mt-3 flex gap-3 text-sm text-opus-warm/75">
            <input
              type="checkbox"
              checked={draft.rightsConfirmed}
              onChange={onCheckbox}
              onBlur={() => markTouched("rightsConfirmed")}
              className="mt-1 h-4 w-4 rounded border-white/[0.25] bg-black/30 text-opus-gold focus:ring-0"
            />
            <span className="leading-relaxed">{t.rightsConfirmHint}</span>
          </label>
          {invalid("rightsConfirmed") ? (
            <p className="mt-2 text-xs text-red-300/70">Required</p>
          ) : null}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onSaveDraft}
            className="rounded-md border border-white/[0.12] px-4 py-2 text-sm text-opus-warm/80 transition hover:border-opus-gold/35 hover:text-opus-gold-light"
          >
            {t.saveDraft}
          </button>
          <button
            type="submit"
            disabled={pending}
            className="opus-surface-metallic rounded-md px-5 py-2 text-sm font-semibold text-opus-charcoal transition hover:opacity-95 disabled:opacity-50"
          >
            {pending ? "…" : t.submitCta}
          </button>
        </div>
          </>
        ) : null}
      </form>

      <aside className="rounded-xl border border-white/[0.08] bg-opus-slate/15 p-5 md:p-6">
        <p className="opus-text-metallic-soft font-mono text-[0.65rem] uppercase tracking-[0.28em]">{t.previewTitle}</p>
        <p className="mt-2 text-xs leading-relaxed text-opus-gold/70">{t.previewPublicOnly}</p>
        {lockedWork?.submissionId && !previewThumbFailed ? (
          <div className="relative mt-4 aspect-[4/3] w-full overflow-hidden rounded-lg border border-white/[0.08] bg-gradient-to-b from-[#1f1f1f] to-opus-charcoal">
            {/* eslint-disable-next-line @next/next/no-img-element -- same-origin public-preview WebP */}
            <img
              src={`/api/artwork-submissions/${encodeURIComponent(lockedWork.submissionId)}/public-preview`}
              alt={preview.title}
              sizes="(min-width: 768px) 320px, 90vw"
              loading="eager"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover opacity-95"
              onError={() => setPreviewThumbFailed(true)}
            />
          </div>
        ) : null}
        <div className="mt-4 space-y-3 text-sm text-opus-warm/70">
          <div className="rounded-lg border border-white/[0.06] bg-black/15 p-4">
            <p className="font-display text-base text-opus-warm">{preview.title}</p>
            <p className="mt-1 text-opus-warm/60">
              <span className="text-opus-gold/90">{preview.penName}</span>
            </p>
            <p className="mt-1 text-[0.7rem] text-opus-warm/40">{t.previewLegalHidden}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-opus-warm/55">
              <span className="rounded border border-white/[0.08] bg-black/10 px-2 py-1">{preview.genreLabel}</span>
              <span className="rounded border border-white/[0.08] bg-black/10 px-2 py-1">{preview.year}</span>
              <span className="rounded border border-opus-gold/25 bg-opus-gold/10 px-2 py-1 text-opus-gold-light">
                {preview.saleModeLabel}
              </span>
              <span className="rounded border border-white/[0.08] bg-black/10 px-2 py-1">{preview.priceJpyDisplay}</span>
              <span className="rounded border border-white/[0.08] bg-black/10 px-2 py-1">{preview.editionRef}</span>
            </div>
            {preview.tags.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {preview.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded border border-white/[0.08] bg-black/10 px-2 py-1 text-[0.7rem] text-opus-warm/60"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
            {preview.description ? (
              <p className="mt-3 text-xs leading-relaxed text-opus-warm/50">{preview.description}</p>
            ) : null}
            {preview.auctionSummary ? (
              <p className="mt-3 text-xs leading-relaxed text-opus-warm/55">{preview.auctionSummary}</p>
            ) : null}
          </div>
          <p className="text-xs leading-relaxed text-opus-warm/45">{t.previewFooter}</p>
        </div>
      </aside>

      {errorModalMessage ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-xl border border-red-400/30 bg-opus-charcoal p-5 shadow-opus-card">
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-red-200/75">Submission Error</p>
            <p className="mt-3 text-sm leading-relaxed text-opus-warm/85">{errorModalMessage}</p>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setErrorModalMessage(null)}
                className="rounded-md border border-white/[0.18] px-4 py-2 text-sm text-opus-warm/85 transition hover:border-opus-gold/35 hover:text-opus-gold-light"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
