"use client";

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { withLocale } from "@/i18n/paths";
import type { Messages } from "@/i18n/types";

type EditionMode = "unique" | "limited";
type NumberingPolicy = "auto" | "manual";

type Draft = {
  editionMode: EditionMode;
  editionTotal: string;
  initialMint: string;
  numberingPolicy: NumberingPolicy;
  lockEdition: boolean;
};

const MAX_EDITIONS = 20;

function editionDraftErrors(d: Draft): Partial<Record<keyof Draft, true>> {
  const e: Partial<Record<keyof Draft, true>> = {};
  const total = Number.parseInt(d.editionTotal, 10);
  if (!Number.isFinite(total) || total < 1 || total > MAX_EDITIONS) e.editionTotal = true;
  if (d.editionMode === "unique" && d.editionTotal !== "1") e.editionTotal = true;
  const initialN = Number.parseInt(d.initialMint, 10);
  const cap = Number.isFinite(total) ? total : MAX_EDITIONS;
  if (!Number.isFinite(initialN) || initialN < 1 || initialN > cap) e.initialMint = true;
  return e;
}

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

function tpl(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ""));
}

export function ArtistEditionEditForm({
  locale,
  m,
  submissionId,
  artistId,
  artworkTitle,
  initial,
}: {
  locale: Locale;
  m: Messages;
  submissionId: string;
  artistId: string;
  artworkTitle: string;
  initial: {
    editionMode: EditionMode;
    editionTotal: number;
    initialMint: number;
    numberingPolicy: NumberingPolicy;
    lockEdition: boolean;
  };
}) {
  const s = m.submitArtwork;
  const aa = m.artistArtworks;
  const router = useRouter();

  const [draft, setDraft] = useState<Draft>({
    editionMode: initial.editionMode,
    editionTotal: String(initial.editionTotal),
    initialMint: String(initial.initialMint),
    numberingPolicy: initial.numberingPolicy,
    lockEdition: initial.lockEdition,
  });
  const [touched, setTouched] = useState<Partial<Record<keyof Draft, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const errors = useMemo(() => editionDraftErrors(draft), [draft]);

  const invalid = (k: keyof Draft) => Boolean(touched[k] && errors[k]);

  const editionPreview = useMemo(() => {
    const total = Number.parseInt(draft.editionTotal || "0", 10);
    const initialN = Number.parseInt(draft.initialMint || "0", 10);
    const safeTotal = Number.isFinite(total) && total > 0 ? total : 0;
    const safeInitial = Number.isFinite(initialN) && initialN > 0 ? initialN : 0;
    const remaining = safeTotal > 0 && safeInitial > 0 ? Math.max(0, safeTotal - safeInitial) : 0;
    const headline =
      draft.editionMode === "unique"
        ? s.editionSummaryUnique
        : tpl(s.editionSummaryLimitedTpl, { initial: safeInitial || "—", total: safeTotal || "—" });
    const sub = tpl(s.editionSummaryMintTpl, { initial: safeInitial || "—", remaining });
    return { headline, sub };
  }, [draft.editionMode, draft.editionTotal, draft.initialMint, s]);

  function onText(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setDraft((d) => {
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

  function onCheckbox(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.name === "lockEdition") {
      setDraft((d) => ({ ...d, lockEdition: e.target.checked }));
    }
  }

  function markTouched(k: keyof Draft) {
    setTouched((t) => ({ ...t, [k]: true }));
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    setTouched({
      editionTotal: true,
      initialMint: true,
      editionMode: true,
      numberingPolicy: true,
      lockEdition: true,
    });
    if (Object.keys(editionDraftErrors(draft)).length > 0) return;
    if (!window.confirm(aa.editionSaveConfirmPrompt)) return;

    setSubmitting(true);
    setServerError(null);
    try {
      const res = await fetch(`/api/artwork-submissions/${encodeURIComponent(submissionId)}/edition`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          editionMode: draft.editionMode,
          editionTotal: Number.parseInt(draft.editionTotal, 10),
          initialMint: Number.parseInt(draft.initialMint, 10),
          numberingPolicy: draft.numberingPolicy,
          lockEdition: draft.lockEdition,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        if (res.status === 409) setServerError(aa.editionSaveConflict);
        else setServerError(aa.editionSaveError);
        return;
      }
      router.push(`${withLocale(locale, "/vault/my-artworks")}?artist=${encodeURIComponent(artistId)}`);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 max-w-xl space-y-6">
      <p className="font-display text-lg text-opus-warm/90">{artworkTitle}</p>

      <div className="rounded-lg border border-white/[0.08] bg-black/15 p-4">
        <p className="opus-text-metallic-soft font-mono text-[0.65rem] uppercase tracking-[0.24em]">
          {s.editionSectionTitle}
        </p>
        <p className={hintClass()}>{s.editionSectionHint}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className={labelClass()}>{s.editionModeLabel}</p>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <label className="flex items-center gap-2 rounded-md border border-white/[0.12] bg-black/15 px-3 py-2 text-sm text-opus-warm/75">
              <input
                type="radio"
                name="editionMode"
                value="unique"
                checked={draft.editionMode === "unique"}
                onChange={onText}
                className="h-4 w-4 border-white/[0.25] bg-black/30 text-opus-gold focus:ring-0"
              />
              {s.editionModeUnique}
            </label>
            <label className="flex items-center gap-2 rounded-md border border-white/[0.12] bg-black/15 px-3 py-2 text-sm text-opus-warm/75">
              <input
                type="radio"
                name="editionMode"
                value="limited"
                checked={draft.editionMode === "limited"}
                onChange={onText}
                className="h-4 w-4 border-white/[0.25] bg-black/30 text-opus-gold focus:ring-0"
              />
              {s.editionModeLimited}
            </label>
          </div>
        </div>
        <div>
          <p className={labelClass()}>{s.editionTotalLabel}</p>
          <input
            name="editionTotal"
            value={draft.editionTotal}
            onChange={onText}
            onBlur={() => markTouched("editionTotal")}
            className={inputClass(invalid("editionTotal"))}
            inputMode="numeric"
            min={1}
            max={MAX_EDITIONS}
            disabled={draft.editionMode === "unique"}
          />
          <p className={hintClass()}>{s.editionTotalHint}</p>
          {invalid("editionTotal") ? (
            <p className="mt-1 text-xs text-red-300/70">{s.editionTotalInvalid}</p>
          ) : null}
        </div>
        <div>
          <p className={labelClass()}>{s.initialMintLabel}</p>
          <input
            name="initialMint"
            value={draft.initialMint}
            onChange={onText}
            onBlur={() => markTouched("initialMint")}
            className={inputClass(invalid("initialMint"))}
            inputMode="numeric"
            min={1}
            max={draft.editionTotal || MAX_EDITIONS}
          />
          <p className={hintClass()}>{s.initialMintHint}</p>
          {invalid("initialMint") ? (
            <p className="mt-1 text-xs text-red-300/70">{s.initialMintInvalid}</p>
          ) : null}
        </div>
        <div>
          <p className={labelClass()}>{s.numberingPolicyLabel}</p>
          <select
            name="numberingPolicy"
            value={draft.numberingPolicy}
            onChange={onText}
            onBlur={() => markTouched("numberingPolicy")}
            className={inputClass(false)}
          >
            <option value="auto">{s.numberingPolicyAuto}</option>
            <option value="manual">{s.numberingPolicyManual}</option>
          </select>
        </div>
        <div className="md:col-span-2 rounded-lg border border-white/[0.08] bg-black/15 p-4">
          <p className={labelClass()}>{s.lockEditionLabel}</p>
          <label className="mt-3 flex gap-3 text-sm text-opus-warm/75">
            <input
              type="checkbox"
              name="lockEdition"
              checked={draft.lockEdition}
              onChange={onCheckbox}
              onBlur={() => markTouched("lockEdition")}
              className="mt-1 h-4 w-4 rounded border-white/[0.25] bg-black/30 text-opus-gold focus:ring-0"
            />
            <span className="leading-relaxed">{s.lockEditionHint}</span>
          </label>
        </div>
        <div className="md:col-span-2 rounded-lg border border-opus-gold/20 bg-opus-gold/[0.06] p-4">
          <p className={labelClass()}>{s.editionSummaryLabel}</p>
          <p className="mt-2 text-sm text-opus-gold-light">{editionPreview.headline}</p>
          <p className="mt-1 text-xs text-opus-warm/65">{editionPreview.sub}</p>
        </div>
      </div>

      {serverError ? <p className="text-sm text-red-300/80">{serverError}</p> : null}

      <div className="flex flex-wrap gap-4">
        <button
          type="submit"
          disabled={submitting}
          className="opus-surface-metallic rounded-md px-5 py-2.5 font-sans text-sm font-medium text-opus-charcoal transition hover:opacity-95 disabled:opacity-50"
        >
          {submitting ? aa.editionSaving : aa.editionSaveCta}
        </button>
        <Link
          href={`${withLocale(locale, "/vault/my-artworks")}?artist=${encodeURIComponent(artistId)}`}
          className="inline-flex items-center rounded-md border border-white/[0.12] px-5 py-2.5 text-sm text-opus-warm/75 transition hover:border-opus-gold/40"
        >
          {aa.backToMyArtworks}
        </Link>
      </div>
      <p className="text-xs leading-relaxed text-opus-warm/50">{aa.editionSaveSaleLockNotice}</p>
    </form>
  );
}
