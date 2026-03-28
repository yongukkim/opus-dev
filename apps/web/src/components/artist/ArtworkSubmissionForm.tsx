"use client";

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import type { Locale } from "@/i18n/config";
import { withLocale } from "@/i18n/paths";
import type { Messages } from "@/i18n/types";

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

type EditionMode = "unique" | "limited";
type NumberingPolicy = "auto" | "manual";

type Draft = {
  actorUserId: string;
  actorRole: "artist" | "operator";
  artistName: string;
  nickname: string;
  artworkTitle: string;
  genre: Genre;
  year: string;
  description: string;
  tags: string;
  editionMode: EditionMode;
  editionTotal: string;
  initialMint: string;
  numberingPolicy: NumberingPolicy;
  lockEdition: boolean;
  rightsConfirmed: boolean;
  file: File | null;
};

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_EDITIONS = 20;
const ACCEPTED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
]);

function bytesLabel(n: number): string {
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)}KB`;
  return `${(n / (1024 * 1024)).toFixed(1)}MB`;
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

export function ArtworkSubmissionForm({ locale, m }: { locale: Locale; m: Messages }) {
  const s = m.submitArtwork;

  const [draft, setDraft] = useState<Draft>({
    actorUserId: "artist-demo-001",
    actorRole: "artist",
    artistName: "",
    nickname: "",
    artworkTitle: "",
    genre: "",
    year: "",
    description: "",
    tags: "",
    editionMode: "limited",
    editionTotal: "20",
    initialMint: "1",
    numberingPolicy: "auto",
    lockEdition: true,
    rightsConfirmed: false,
    file: null,
  });

  const [touched, setTouched] = useState<Partial<Record<keyof Draft, boolean>>>({});
  const [banner, setBanner] = useState<string | null>(null);

  const fileMeta = useMemo(() => {
    if (!draft.file) return null;
    return { name: draft.file.name, type: draft.file.type, size: draft.file.size };
  }, [draft.file]);

  const errors = useMemo(() => {
    const e: Partial<Record<keyof Draft, string>> = {};
    const trim = (v: string) => v.trim();

    if (!trim(draft.artistName)) e["artistName"] = "Required";
    if (!trim(draft.nickname)) e["nickname"] = "Required";
    if (!trim(draft.artworkTitle)) e["artworkTitle"] = "Required";
    if (!draft.genre) e["genre"] = "Required";
    if (!draft.file) e["file"] = "Required";

    if (draft.year.trim()) {
      const y = Number.parseInt(draft.year, 10);
      const current = new Date().getFullYear();
      if (!Number.isFinite(y) || y < 1900 || y > current + 1) e["year"] = "Invalid year";
    }

    const total = Number.parseInt(draft.editionTotal, 10);
    if (!Number.isFinite(total) || total < 1 || total > MAX_EDITIONS) e["editionTotal"] = "Invalid";
    if (draft.editionMode === "unique" && draft.editionTotal !== "1") e["editionTotal"] = "Invalid";

    const initial = Number.parseInt(draft.initialMint, 10);
    if (!Number.isFinite(initial) || initial < 1) {
      e["initialMint"] = "Invalid";
    } else if (Number.isFinite(total) && initial > total) {
      e["initialMint"] = "Invalid";
    }

    if (draft.file) {
      if (draft.file.size > MAX_BYTES) e["file"] = `Max ${bytesLabel(MAX_BYTES)}`;
      if (draft.file.type && !ACCEPTED_MIME.has(draft.file.type)) e["file"] = "Unsupported type";
    }

    if (!draft.rightsConfirmed) e["rightsConfirmed"] = "Confirm required";

    return e;
  }, [draft]);

  const hasErrors = Object.keys(errors).length > 0;

  function markTouched(name: keyof Draft) {
    setTouched((t) => ({ ...t, [name]: true }));
  }

  function onText(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
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

      return { ...d, [name]: value } as Draft;
    });
  }

  function onCheckbox(e: ChangeEvent<HTMLInputElement>) {
    const { name, checked } = e.target;
    setDraft((d) => ({ ...d, [name]: checked } as Draft));
  }

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setDraft((d) => ({ ...d, file: f }));
  }

  function onSaveDraft() {
    setBanner("Draft saved locally (UI only).");
    window.setTimeout(() => setBanner(null), 2200);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();

    /**
     * ISO 27001 / OPUS Security Coding Standards
     * - A.14.2.1 (§1) Input Validation & Sanitization
     *   KO: 모든 입력값/파일은 신뢰할 수 없으므로 서버 측에서도 화이트리스트 검증(확장자·MIME·용량·필드 길이) 후 처리합니다.
     *   JA: すべての入力/ファイルは信頼できないため、サーバ側でもホワイトリスト検証（拡張子・MIME・容量・長さ）後に処理します。
     *   EN: Treat all fields/files as untrusted; validate on the server with a strict allowlist (type/size/length) before processing.
     */

    setTouched({
      artistName: true,
      nickname: true,
      artworkTitle: true,
      genre: true,
      year: true,
      description: true,
      tags: true,
      editionMode: true,
      editionTotal: true,
      initialMint: true,
      numberingPolicy: true,
      lockEdition: true,
      rightsConfirmed: true,
      file: true,
    });

    if (hasErrors) {
      setBanner(s.apiSaveErr);
      return;
    }

    void (async () => {
      try {
        const fd = new FormData();
        fd.set("artistName", draft.artistName);
        fd.set("nickname", draft.nickname);
        fd.set("artworkTitle", draft.artworkTitle);
        fd.set("genre", draft.genre);
        fd.set("year", draft.year);
        fd.set("description", draft.description);
        fd.set("tags", draft.tags);
        fd.set("editionMode", draft.editionMode);
        fd.set("editionTotal", draft.editionTotal);
        fd.set("initialMint", draft.initialMint);
        fd.set("numberingPolicy", draft.numberingPolicy);
        fd.set("lockEdition", String(draft.lockEdition));
        fd.set("rightsConfirmed", String(draft.rightsConfirmed));
        if (draft.file) fd.set("file", draft.file);

        const res = await fetch("/api/artwork-submissions", {
          method: "POST",
          body: fd,
          headers: {
            "x-opus-user-id": draft.actorUserId.trim(),
            "x-opus-role": draft.actorRole,
          },
        });
        if (!res.ok) throw new Error("bad_status");

        setBanner(s.apiSaveOk);
        const uid = draft.actorUserId.trim();
        const q = new URLSearchParams();
        if (uid) q.set("artist", uid);
        const qs = q.toString();
        const path = qs ? `/vault/my-artworks?${qs}` : "/vault/my-artworks";
        window.setTimeout(() => {
          window.location.href = withLocale(locale, path);
        }, 900);
      } catch {
        setBanner(s.apiSaveErr);
      }
    })();
  }

  const preview = useMemo(() => {
    const safe = (v: string) => v.trim() || "—";
    const genre = draft.genre || "—";
    const year = draft.year.trim() || "—";
    const total = draft.editionTotal.trim() || "—";
    const initialMint = draft.initialMint.trim() || "—";
    const numberingPolicy = draft.numberingPolicy === "manual" ? s.numberingPolicyManual : s.numberingPolicyAuto;
    const editionMode = draft.editionMode === "unique" ? s.editionModeUnique : s.editionModeLimited;
    const tags =
      draft.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 8) || [];
    return {
      artistName: safe(draft.artistName),
      nickname: safe(draft.nickname),
      artworkTitle: safe(draft.artworkTitle),
      genre,
      year,
      total,
      initialMint,
      numberingPolicy,
      editionMode,
      tags,
    };
  }, [draft]);

  const invalid = (k: keyof Draft) => Boolean((touched[k] || banner) && errors[k]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.25fr,0.75fr]">
      <form
        onSubmit={onSubmit}
        className="rounded-xl border border-white/[0.08] bg-opus-slate/20 p-5 shadow-opus-card md:p-6"
      >
        {banner ? (
          <div className="mb-5 rounded-lg border border-white/[0.10] bg-black/25 px-4 py-3 text-sm text-opus-warm/70">
            {banner}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className={labelClass()}>Actor userId (dev)</p>
            <input
              name="actorUserId"
              value={draft.actorUserId}
              onChange={onText}
              className={inputClass(false)}
              autoComplete="off"
            />
          </div>
          <div>
            <p className={labelClass()}>Actor role (dev)</p>
            <select name="actorRole" value={draft.actorRole} onChange={onText} className={inputClass(false)}>
              <option value="artist">artist</option>
              <option value="operator">operator</option>
            </select>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <p className={labelClass()}>{s.artistNameLabel}</p>
            <input
              name="artistName"
              value={draft.artistName}
              onChange={onText}
              onBlur={() => markTouched("artistName")}
              className={inputClass(invalid("artistName"))}
              autoComplete="name"
            />
          </div>
          <div>
            <p className={labelClass()}>{s.nicknameLabel}</p>
            <input
              name="nickname"
              value={draft.nickname}
              onChange={onText}
              onBlur={() => markTouched("nickname")}
              className={inputClass(invalid("nickname"))}
            />
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <p className={labelClass()}>{s.artworkTitleLabel}</p>
            <input
              name="artworkTitle"
              value={draft.artworkTitle}
              onChange={onText}
              onBlur={() => markTouched("artworkTitle")}
              className={inputClass(invalid("artworkTitle"))}
            />
          </div>

          <div>
            <p className={labelClass()}>{s.genreLabel}</p>
            <select
              name="genre"
              value={draft.genre}
              onChange={onText}
              onBlur={() => markTouched("genre")}
              className={inputClass(invalid("genre"))}
            >
              <option value="">{s.genrePlaceholder}</option>
              <option value="digital-painting">Digital painting</option>
              <option value="illustration">Illustration</option>
              <option value="photography">Photography</option>
              <option value="3d">3D</option>
              <option value="generative">Generative</option>
              <option value="video">Video</option>
              <option value="mixed-media">Mixed media</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <p className={labelClass()}>{s.yearLabel}</p>
            <input
              name="year"
              value={draft.year}
              onChange={onText}
              onBlur={() => markTouched("year")}
              className={inputClass(invalid("year"))}
              inputMode="numeric"
              placeholder="2026"
            />
          </div>
        </div>

        <div className="mt-5">
          <p className={labelClass()}>{s.descriptionLabel}</p>
          <textarea
            name="description"
            value={draft.description}
            onChange={onText}
            onBlur={() => markTouched("description")}
            className={`${inputClass(false)} min-h-28 resize-y`}
          />
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <p className={labelClass()}>{s.tagsLabel}</p>
            <input
              name="tags"
              value={draft.tags}
              onChange={onText}
              onBlur={() => markTouched("tags")}
              className={inputClass(false)}
              placeholder="abstract, monochrome"
            />
            <p className={hintClass()}>{s.tagsHint}</p>
          </div>
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
        </div>

        <div className="mt-6">
          <p className={labelClass()}>{s.uploadLabel}</p>
          <input
            type="file"
            name="file"
            onChange={onFile}
            onBlur={() => markTouched("file")}
            className="mt-2 block w-full cursor-pointer rounded-md border border-white/[0.12] bg-black/15 px-3 py-2 text-sm text-opus-warm/75 file:mr-4 file:rounded file:border-0 file:bg-opus-gold/15 file:px-3 file:py-2 file:text-sm file:text-opus-gold hover:border-opus-gold/40"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
          />
          <p className={hintClass()}>{s.uploadHint}</p>
          {fileMeta ? (
            <p className="mt-2 font-mono text-[0.7rem] text-opus-warm/50">
              {fileMeta.name} · {fileMeta.type || "unknown"} · {bytesLabel(fileMeta.size)}
            </p>
          ) : null}
        </div>

        <div className="mt-6 rounded-lg border border-white/[0.08] bg-black/15 p-4">
          <p className={labelClass()}>{s.rightsConfirmLabel}</p>
          <label className="mt-3 flex gap-3 text-sm text-opus-warm/75">
            <input
              type="checkbox"
              name="rightsConfirmed"
              checked={draft.rightsConfirmed}
              onChange={onCheckbox}
              onBlur={() => markTouched("rightsConfirmed")}
              className="mt-1 h-4 w-4 rounded border-white/[0.25] bg-black/30 text-opus-gold focus:ring-0"
            />
            <span className="leading-relaxed">{s.rightsConfirmHint}</span>
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
            {s.saveDraft}
          </button>
          <button
            type="submit"
            className="opus-surface-metallic rounded-md px-5 py-2 text-sm font-semibold text-opus-charcoal transition hover:opacity-95"
          >
            {s.submit}
          </button>
        </div>
      </form>

      <aside className="rounded-xl border border-white/[0.08] bg-opus-slate/15 p-5 md:p-6">
        <p className="opus-text-metallic-soft font-mono text-[0.65rem] uppercase tracking-[0.28em]">
          {s.previewTitle}
        </p>
        <div className="mt-4 space-y-3 text-sm text-opus-warm/70">
          <div className="rounded-lg border border-white/[0.06] bg-black/15 p-4">
            <p className="font-display text-base text-opus-warm">{preview.artworkTitle}</p>
            <p className="mt-1 text-opus-warm/55">
              {preview.nickname} <span className="text-opus-warm/35">/</span> {preview.artistName}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-opus-warm/55">
              <span className="rounded border border-white/[0.08] bg-black/10 px-2 py-1">{preview.genre}</span>
              <span className="rounded border border-white/[0.08] bg-black/10 px-2 py-1">{preview.year}</span>
              <span className="rounded border border-white/[0.08] bg-black/10 px-2 py-1">{preview.editionMode}</span>
              <span className="rounded border border-white/[0.08] bg-black/10 px-2 py-1">{preview.total} editions</span>
              <span className="rounded border border-white/[0.08] bg-black/10 px-2 py-1">
                mint {preview.initialMint}
              </span>
              <span className="rounded border border-white/[0.08] bg-black/10 px-2 py-1">{preview.numberingPolicy}</span>
            </div>
            {preview.tags.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {preview.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded border border-white/[0.08] bg-black/10 px-2 py-1 text-[0.7rem] text-opus-warm/60"
                  >
                    {t}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <p className="text-xs leading-relaxed text-opus-warm/45">
            This is a UI-only form for now. When we connect the API, we’ll add server-side validation, malware scanning,
            storage policy, and Chronicle linking.
          </p>
        </div>
      </aside>
    </div>
  );
}

