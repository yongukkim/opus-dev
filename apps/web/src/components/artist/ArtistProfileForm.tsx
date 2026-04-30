"use client";

import { useState } from "react";
import type { Messages } from "@/i18n/types";

type Props = {
  m: Messages;
  initialDisplayName: string;
  initialBio: string;
  initialUseSsoImage: boolean;
  initialSsoImageUrl: string;
};

export function ArtistProfileForm({
  m,
  initialDisplayName,
  initialBio,
  initialUseSsoImage,
  initialSsoImageUrl,
}: Props) {
  const a = m.artistProfile;
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio);
  const [useSsoImage, setUseSsoImage] = useState(initialUseSsoImage);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-opus-slate/20 shadow-opus-card">
      <div className="border-b border-white/[0.06] px-6 py-6">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-opus-warm/45">{a.heading}</p>
        <p className="mt-4 text-sm leading-relaxed text-opus-warm/60">{a.body}</p>
      </div>

      <form
        className="space-y-4 px-6 py-6"
        onSubmit={async (e) => {
          e.preventDefault();
          setSaved(false);
          setError("");
          setSaving(true);
          try {
            const res = await fetch("/api/artist/profile", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ displayName, bio, useSsoImage }),
            });
            if (!res.ok) {
              setError(a.saveFailedBanner);
              return;
            }
            const j = (await res.json()) as { profile?: { displayName?: string } };
            if (typeof j.profile?.displayName === "string") {
              setDisplayName(j.profile.displayName);
            }
            setSaved(true);
            window.setTimeout(() => setSaved(false), 2000);
          } catch {
            setError(a.saveFailedBanner);
          } finally {
            setSaving(false);
          }
        }}
      >
        {saved ? (
          <div className="rounded-lg border border-white/[0.10] bg-black/25 px-4 py-3 text-sm text-opus-warm/70">
            {a.savedBanner}
          </div>
        ) : null}
        {error ? (
          <div className="rounded-lg border border-red-200/20 bg-red-900/20 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <label className="block">
          <span className="block font-mono text-[0.65rem] uppercase tracking-[0.22em] text-opus-warm/45">
            {a.displayNameLabel}
          </span>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/[0.12] bg-black/25 px-4 py-3 text-sm text-opus-warm/85 outline-none transition focus:border-opus-gold/45 focus:ring-2 focus:ring-opus-gold/20"
            placeholder={a.displayNamePlaceholder}
            autoComplete="nickname"
          />
          <p className="mt-2 text-xs text-opus-warm/50">{a.displayNameHint}</p>
        </label>

        <label className="block">
          <span className="block font-mono text-[0.65rem] uppercase tracking-[0.22em] text-opus-warm/45">
            {a.bioLabel}
          </span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="mt-2 min-h-28 w-full resize-y rounded-xl border border-white/[0.12] bg-black/25 px-4 py-3 text-sm text-opus-warm/85 outline-none transition focus:border-opus-gold/45 focus:ring-2 focus:ring-opus-gold/20"
            placeholder={a.bioPlaceholder}
          />
        </label>

        <div className="rounded-xl border border-white/[0.08] bg-black/20 p-4">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-opus-warm/45">
            {a.ssoImageTitle}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-opus-warm/60">{a.ssoImageBody}</p>
          {initialSsoImageUrl ? (
            <label className="mt-3 flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={useSsoImage}
                onChange={(e) => setUseSsoImage(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-white/[0.3] bg-black/20 text-opus-gold focus:ring-opus-gold/40"
              />
              <span className="text-xs text-opus-warm/75">{a.ssoImageUseCheckbox}</span>
            </label>
          ) : (
            <p className="mt-3 text-xs text-opus-warm/50">{a.ssoImageMissing}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="opus-surface-metallic inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold tracking-[0.12em] text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? a.savingCta : a.saveCta}
        </button>

        <p className="text-center text-xs text-opus-warm/45">{a.note}</p>
      </form>
    </div>
  );
}

