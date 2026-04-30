"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withLocale } from "@/i18n/paths";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/types";

type Props = {
  locale: Locale;
  m: Messages;
  returnTo: string;
  initialDisplayName: string;
  initialBankName: string;
  initialAccountHolder: string;
  initialAccountNumber: string;
};

export function ArtistOnboardingProfileForm({
  locale,
  m,
  returnTo,
  initialDisplayName,
  initialBankName,
  initialAccountHolder,
  initialAccountNumber,
}: Props) {
  const o = m.artistOnboarding;
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bankName, setBankName] = useState(initialBankName);
  const [accountHolder, setAccountHolder] = useState(initialAccountHolder);
  const [accountNumber, setAccountNumber] = useState(initialAccountNumber);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const displayNameLocked = Boolean(initialDisplayName.trim());

  return (
    <form
      className="mt-10 overflow-hidden rounded-xl border border-white/[0.08] bg-opus-slate/30 shadow-opus-card"
      onSubmit={async (e) => {
        e.preventDefault();
        if (pending) return;
        setError("");
        setPending(true);
        try {
          const res = await fetch("/api/artist/onboarding-profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              displayName,
              bankName,
              accountHolder,
              accountNumber,
            }),
          });
          if (!res.ok) {
            if (res.status === 409) setError(o.penNameLockedError);
            else setError(o.saveFailedBanner);
            return;
          }
          const next = `${withLocale(locale, "/artist/kyc/consent")}?returnTo=${encodeURIComponent(returnTo)}`;
          router.push(next);
          router.refresh();
        } catch {
          setError(o.saveFailedBanner);
        } finally {
          setPending(false);
        }
      }}
    >
      <div className="border-b border-white/[0.06] px-6 py-6">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-opus-warm/45">{o.heading}</p>
        <p className="mt-4 text-sm leading-relaxed text-opus-warm/65">{o.body}</p>
      </div>

      <div className="space-y-4 px-6 py-6">
        {error ? (
          <div className="rounded-lg border border-red-200/20 bg-red-900/20 px-4 py-3 text-sm text-red-100">{error}</div>
        ) : null}

        <label className="block">
          <span className="block font-mono text-[0.65rem] uppercase tracking-[0.22em] text-opus-warm/45">
            {o.displayNameLabel}
          </span>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={displayNameLocked}
            className="mt-2 w-full rounded-xl border border-white/[0.12] bg-black/25 px-4 py-3 text-sm text-opus-warm/85 outline-none transition focus:border-opus-gold/45 focus:ring-2 focus:ring-opus-gold/20 disabled:opacity-70"
            placeholder={o.displayNamePlaceholder}
            autoComplete="nickname"
          />
          <p className="mt-2 text-xs text-opus-warm/50">
            {displayNameLocked ? o.displayNameLockedHint : o.displayNameSetupHint}
          </p>
        </label>

        <label className="block">
          <span className="block font-mono text-[0.65rem] uppercase tracking-[0.22em] text-opus-warm/45">
            {o.bankNameLabel}
          </span>
          <input
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/[0.12] bg-black/25 px-4 py-3 text-sm text-opus-warm/85 outline-none transition focus:border-opus-gold/45 focus:ring-2 focus:ring-opus-gold/20"
            placeholder={o.bankNamePlaceholder}
            autoComplete="off"
          />
        </label>

        <label className="block">
          <span className="block font-mono text-[0.65rem] uppercase tracking-[0.22em] text-opus-warm/45">
            {o.accountHolderLabel}
          </span>
          <input
            value={accountHolder}
            onChange={(e) => setAccountHolder(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/[0.12] bg-black/25 px-4 py-3 text-sm text-opus-warm/85 outline-none transition focus:border-opus-gold/45 focus:ring-2 focus:ring-opus-gold/20"
            placeholder={o.accountHolderPlaceholder}
            autoComplete="name"
          />
        </label>

        <label className="block">
          <span className="block font-mono text-[0.65rem] uppercase tracking-[0.22em] text-opus-warm/45">
            {o.accountNumberLabel}
          </span>
          <input
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
            className="mt-2 w-full rounded-xl border border-white/[0.12] bg-black/25 px-4 py-3 text-sm text-opus-warm/85 outline-none transition focus:border-opus-gold/45 focus:ring-2 focus:ring-opus-gold/20"
            placeholder={o.accountNumberPlaceholder}
            inputMode="numeric"
            autoComplete="off"
          />
          <p className="mt-2 text-xs text-opus-warm/50">{o.accountNumberHint}</p>
        </label>

        <button
          type="submit"
          disabled={pending}
          className="opus-surface-metallic inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold tracking-[0.12em] text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? o.savingCta : o.saveAndContinueCta}
        </button>
      </div>
    </form>
  );
}
