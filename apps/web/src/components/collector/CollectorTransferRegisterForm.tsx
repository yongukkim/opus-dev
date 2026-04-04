"use client";

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/types";
import type { VaultUiRole } from "@/lib/vaultRole";
import Link from "next/link";
import { withLocale } from "@/i18n/paths";

type Genre =
  | ""
  | "digital-painting"
  | "photography"
  | "3d"
  | "generative"
  | "illustration"
  | "video"
  | "mixed-media"
  | "other";

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
  note: string;
  rightsConfirmed: boolean;
};

function inputClass(invalid: boolean): string {
  return `w-full rounded-md border bg-black/20 px-3 py-2 font-sans text-sm text-opus-warm/85 outline-none transition ${
    invalid
      ? "border-red-400/35 focus:border-red-300/55"
      : "border-white/[0.12] focus:border-opus-gold/45"
  }`;
}

function labelClass(): string {
  return "font-mono text-[0.65rem] uppercase tracking-[0.22em] text-opus-warm/50";
}

function hintClass(): string {
  return "mt-2 text-xs leading-relaxed text-opus-warm/45";
}

function sectionRule(title: string) {
  return (
    <div className="mt-8 border-t border-white/[0.08] pt-6 first:mt-0 first:border-t-0 first:pt-0">
      <p className="opus-text-metallic-soft font-mono text-[0.65rem] uppercase tracking-[0.24em]">{title}</p>
    </div>
  );
}

export function CollectorTransferRegisterForm({
  locale,
  m,
  vaultRole,
}: {
  locale: Locale;
  m: Messages;
  vaultRole: VaultUiRole;
}) {
  const t = m.collectorTransfer;
  const apiRole = vaultRole === "artist" ? "artist" : "collector";

  const [draft, setDraft] = useState<Draft>({
    userId: "collector-demo-001",
    artistLegalName: "",
    artistPenName: "",
    artworkTitle: "",
    genre: "",
    year: "",
    description: "",
    tags: "",
    editionRef: "",
    priceJpy: "",
    note: "",
    rightsConfirmed: false,
  });

  const [touched, setTouched] = useState<Partial<Record<keyof Draft, boolean>>>({});
  const [banner, setBanner] = useState<"ok" | "err" | string | null>(null);
  const [pending, setPending] = useState(false);

  const errors = useMemo(() => {
    const e: Partial<Record<keyof Draft, string>> = {};
    if (!draft.artistPenName.trim()) e.artistPenName = "Required";
    if (!draft.artworkTitle.trim()) e.artworkTitle = "Required";
    if (!draft.genre) e.genre = "Required";

    if (draft.year.trim()) {
      const y = Number.parseInt(draft.year, 10);
      const current = new Date().getFullYear();
      if (!Number.isFinite(y) || y < 1900 || y > current + 1) e.year = "Invalid";
    }

    const priceParsed = Number.parseInt(draft.priceJpy, 10);
    if (!draft.priceJpy.trim() || !Number.isFinite(priceParsed) || priceParsed < 1 || priceParsed > 99_999_999) {
      e.priceJpy = "Invalid";
    }

    if (!draft.rightsConfirmed) e.rightsConfirmed = "Confirm required";

    return e;
  }, [draft]);

  const hasErrors = Object.keys(errors).length > 0;

  function markTouched(name: keyof Draft) {
    setTouched((prev) => ({ ...prev, [name]: true }));
  }

  function onText(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    if (name === "priceJpy") {
      setDraft((d) => ({ ...d, priceJpy: value.replace(/\D/g, "").slice(0, 8) }));
      return;
    }
    setDraft((d) => ({ ...d, [name]: value } as Draft));
  }

  function onCheckbox(e: ChangeEvent<HTMLInputElement>) {
    setDraft((d) => ({ ...d, rightsConfirmed: e.target.checked }));
  }

  function onSaveDraft() {
    setBanner(t.saveDraft + " — UI only.");
    window.setTimeout(() => setBanner(null), 2200);
  }

  const invalid = (k: keyof Draft) => Boolean((touched[k] || banner === "err") && errors[k]);

  const preview = useMemo(() => {
    const safe = (s: string, fb: string) => (s.trim() ? s.trim() : fb);
    const genreLabel =
      draft.genre === "digital-painting"
        ? t.genreOptDigitalPainting
        : draft.genre === "illustration"
          ? t.genreOptIllustration
          : draft.genre === "photography"
            ? t.genreOptPhotography
            : draft.genre === "3d"
              ? t.genreOpt3d
              : draft.genre === "generative"
                ? t.genreOptGenerative
                : draft.genre === "video"
                  ? t.genreOptVideo
                  : draft.genre === "mixed-media"
                    ? t.genreOptMixedMedia
                    : draft.genre === "other"
                      ? t.genreOptOther
                      : "—";
    const priceJpyDisplay = draft.priceJpy.trim()
      ? `¥${Number(draft.priceJpy).toLocaleString("ja-JP")}`
      : "—";
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
      tags: tagList,
      description: draft.description.trim(),
    };
  }, [draft, t]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();

    /**
     * ISO 27001 A.14.2.1 (§1)
     * KO: 클라이언트는 편의용 검증만 하며, 최종 검증은 API에서 수행합니다.
     * JA: クライアントは便宜上の検証のみとし、最終検証はAPIで行います。
     * EN: Client checks are advisory; the API performs authoritative validation.
     */
    setTouched({
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
      note: true,
      rightsConfirmed: true,
    });

    if (!draft.rightsConfirmed) {
      window.alert(t.consentRequiredAlert);
      return;
    }

    if (hasErrors) {
      setBanner("err");
      return;
    }

    const price = Number.parseInt(draft.priceJpy, 10);
    setPending(true);
    setBanner(null);
    try {
      const fd = new FormData();
      fd.set("artistLegalName", draft.artistLegalName.trim());
      fd.set("artistPenName", draft.artistPenName.trim());
      fd.set("artworkTitle", draft.artworkTitle.trim());
      fd.set("genre", draft.genre);
      fd.set("year", draft.year.trim());
      fd.set("description", draft.description.trim());
      fd.set("tags", draft.tags.trim());
      fd.set("editionRef", draft.editionRef.trim());
      fd.set("priceJpy", String(price));
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
      if (!res.ok) throw new Error("bad");
      setBanner("ok");
      setDraft((d) => ({
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
        note: "",
        rightsConfirmed: false,
      }));
      setTouched({});
    } catch {
      setBanner("err");
    } finally {
      setPending(false);
    }
  }

  const listingsHref = withLocale(locale, "/listings/collector-transfers");

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
        {banner === "err" ? (
          <div className="mb-5 rounded-lg border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200/90">
            {t.errorBanner}
          </div>
        ) : null}
        {typeof banner === "string" && banner !== "ok" && banner !== "err" ? (
          <div className="mb-5 rounded-lg border border-white/[0.10] bg-black/25 px-4 py-3 text-sm text-opus-warm/70">
            {banner}
          </div>
        ) : null}

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

        {sectionRule(t.sectionArtist)}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
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
          <div>
            <p className={labelClass()}>{t.artistPenNameLabel}</p>
            <input
              name="artistPenName"
              value={draft.artistPenName}
              onChange={onText}
              onBlur={() => markTouched("artistPenName")}
              className={`${inputClass(invalid("artistPenName"))} mt-2`}
              autoComplete="off"
            />
            <p className={hintClass()}>{t.artistPenNameHint}</p>
            {invalid("artistPenName") ? <p className="mt-1 text-xs text-red-300/70">Required</p> : null}
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
              className={`${inputClass(invalid("genre"))} mt-2`}
            >
              <option value="">{t.genrePlaceholder}</option>
              <option value="digital-painting">{t.genreOptDigitalPainting}</option>
              <option value="illustration">{t.genreOptIllustration}</option>
              <option value="photography">{t.genreOptPhotography}</option>
              <option value="3d">{t.genreOpt3d}</option>
              <option value="generative">{t.genreOptGenerative}</option>
              <option value="video">{t.genreOptVideo}</option>
              <option value="mixed-media">{t.genreOptMixedMedia}</option>
              <option value="other">{t.genreOptOther}</option>
            </select>
            {invalid("genre") ? <p className="mt-1 text-xs text-red-300/70">Required</p> : null}
          </div>

          <div>
            <p className={labelClass()}>{t.yearLabel}</p>
            <input
              name="year"
              value={draft.year}
              onChange={onText}
              onBlur={() => markTouched("year")}
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
              className={`${inputClass(false)} mt-2`}
            />
            <p className={hintClass()}>{t.editionRefHint}</p>
          </div>
        </div>

        {sectionRule(t.sectionOffer)}
        <div className="mt-4 max-w-md">
          <p className={labelClass()}>{t.priceLabel}</p>
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
          <p className={hintClass()}>{t.priceHint}</p>
          {invalid("priceJpy") ? <p className="mt-1 text-xs text-red-300/70">Invalid</p> : null}
        </div>

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
      </form>

      <aside className="rounded-xl border border-white/[0.08] bg-opus-slate/15 p-5 md:p-6">
        <p className="opus-text-metallic-soft font-mono text-[0.65rem] uppercase tracking-[0.28em]">{t.previewTitle}</p>
        <p className="mt-2 text-xs leading-relaxed text-opus-gold/70">{t.previewPublicOnly}</p>
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
          </div>
          <p className="text-xs leading-relaxed text-opus-warm/45">{t.previewFooter}</p>
        </div>
      </aside>
    </div>
  );
}
