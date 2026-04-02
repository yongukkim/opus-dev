"use client";

import Link from "next/link";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/types";

export function ArtistKycConsentPanel({
  locale,
  m,
  startHref,
  termsHref,
  privacyHref,
}: {
  locale: Locale;
  m: Messages;
  startHref: string;
  termsHref: string;
  privacyHref: string;
}) {
  const [checked, setChecked] = useState(false);
  const inactive = !checked;

  return (
    <div className="mt-10 overflow-hidden rounded-xl border border-white/[0.08] bg-opus-slate/30 shadow-opus-card">
      <div className="border-b border-white/[0.06] px-6 py-6">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-opus-warm/45">
          {m.artistKyc.consentHeading}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-opus-warm/70">{m.artistKyc.consentBody}</p>
      </div>

      <div className="px-6 py-6">
        <label className="flex items-start gap-3 rounded-xl border border-white/[0.10] bg-black/20 px-5 py-4">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-white/[0.25] bg-black/40 text-opus-gold focus:ring-0"
          />
          <span className="text-sm leading-relaxed text-opus-warm/75">
            {m.artistKyc.consentCheckbox}{" "}
            <Link href={termsHref} className="text-opus-gold underline-offset-4 hover:underline">
              {m.footer.terms}
            </Link>
            {m.auth.consentBetween}
            <Link href={privacyHref} className="text-opus-gold underline-offset-4 hover:underline">
              {m.footer.privacy}
            </Link>
            {m.auth.consentConclude}
          </span>
        </label>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href={startHref}
            aria-disabled={inactive}
            className={`opus-surface-metallic inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold tracking-[0.12em] text-black transition sm:w-auto ${
              inactive ? "pointer-events-none opacity-45" : "hover:opacity-95"
            }`}
          >
            {m.artistKyc.startCta}
          </Link>
          <p className="text-xs text-opus-warm/45">{m.artistKyc.consentNote}</p>
        </div>
      </div>
    </div>
  );
}

