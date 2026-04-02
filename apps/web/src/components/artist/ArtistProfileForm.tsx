"use client";

import { useState } from "react";
import type { Messages } from "@/i18n/types";

export function ArtistProfileForm({ m }: { m: Messages }) {
  const a = m.artistProfile;
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [saved, setSaved] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-opus-slate/20 shadow-opus-card">
      <div className="border-b border-white/[0.06] px-6 py-6">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-opus-warm/45">{a.heading}</p>
        <p className="mt-4 text-sm leading-relaxed text-opus-warm/60">{a.body}</p>
      </div>

      <form
        className="space-y-4 px-6 py-6"
        onSubmit={(e) => {
          e.preventDefault();
          setSaved(true);
          window.setTimeout(() => setSaved(false), 2000);
        }}
      >
        {saved ? (
          <div className="rounded-lg border border-white/[0.10] bg-black/25 px-4 py-3 text-sm text-opus-warm/70">
            {a.savedBanner}
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
          />
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

        <button
          type="submit"
          className="opus-surface-metallic inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold tracking-[0.12em] text-black transition hover:opacity-95"
        >
          {a.saveCta}
        </button>

        <p className="text-center text-xs text-opus-warm/45">{a.note}</p>
      </form>
    </div>
  );
}

