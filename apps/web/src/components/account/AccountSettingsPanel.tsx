"use client";

import Link from "next/link";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/types";
import { withLocale } from "@/i18n/paths";

function labelClass(): string {
  return "block font-mono text-[0.65rem] uppercase tracking-[0.22em] text-opus-warm/45";
}

function inputClass(): string {
  return "mt-2 w-full rounded-xl border border-white/[0.12] bg-black/25 px-4 py-3 text-sm text-opus-warm/85 outline-none transition focus:border-opus-gold/45 focus:ring-2 focus:ring-opus-gold/20";
}

export function AccountSettingsPanel({
  locale,
  m,
  isArtist,
}: {
  locale: Locale;
  m: Messages;
  isArtist: boolean;
}) {
  const s = m.accountSettings;
  const [saved, setSaved] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const mismatch = newPassword.length > 0 && confirmPassword.length > 0 && newPassword !== confirmPassword;

  return (
    <div className="space-y-6">
      {saved ? (
        <div className="rounded-lg border border-white/[0.10] bg-black/25 px-4 py-3 text-sm text-opus-warm/70">
          {s.savedBanner}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-white/[0.08] bg-opus-slate/20 shadow-opus-card">
        <div className="border-b border-white/[0.06] px-6 py-6">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-opus-warm/45">
            {s.profileHeading}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-opus-warm/60">{s.profileBody}</p>
        </div>
        <form
          className="space-y-4 px-6 py-6"
          onSubmit={(e) => {
            e.preventDefault();
            setSaved(true);
            window.setTimeout(() => setSaved(false), 2000);
          }}
        >
          <label className="block">
            <span className={labelClass()}>{s.displayNameLabel}</span>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={inputClass()}
              placeholder={s.displayNamePlaceholder}
              autoComplete="name"
            />
          </label>
          <label className="block">
            <span className={labelClass()}>{s.emailLabel}</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass()}
              placeholder={s.emailPlaceholder}
              autoComplete="email"
              inputMode="email"
            />
          </label>
          <button
            type="submit"
            className="opus-surface-metallic inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold tracking-[0.12em] text-black transition hover:opacity-95"
          >
            {s.saveProfileCta}
          </button>
        </form>
      </section>

      <section className="overflow-hidden rounded-xl border border-white/[0.08] bg-opus-slate/20 shadow-opus-card">
        <div className="border-b border-white/[0.06] px-6 py-6">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-opus-warm/45">
            {s.passwordHeading}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-opus-warm/60">{s.passwordBody}</p>
        </div>
        <form
          className="space-y-4 px-6 py-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (mismatch) {
              window.alert(s.passwordMismatchAlert);
              return;
            }
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setSaved(true);
            window.setTimeout(() => setSaved(false), 2000);
          }}
        >
          <label className="block">
            <span className={labelClass()}>{s.currentPasswordLabel}</span>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputClass()}
              autoComplete="current-password"
            />
          </label>
          <label className="block">
            <span className={labelClass()}>{s.newPasswordLabel}</span>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass()}
              autoComplete="new-password"
            />
          </label>
          <label className="block">
            <span className={labelClass()}>{s.confirmPasswordLabel}</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass()}
              autoComplete="new-password"
            />
          </label>
          {mismatch ? <p className="text-xs text-red-300/75">{s.passwordMismatchAlert}</p> : null}
          <button
            type="submit"
            className="opus-surface-metallic inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold tracking-[0.12em] text-black transition hover:opacity-95"
          >
            {s.changePasswordCta}
          </button>
        </form>
      </section>

      {isArtist ? (
        <section className="overflow-hidden rounded-xl border border-white/[0.08] bg-opus-slate/20 shadow-opus-card">
          <div className="border-b border-white/[0.06] px-6 py-6">
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-opus-warm/45">
              {s.linksHeading}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-opus-warm/60">{s.note}</p>
          </div>
          <div className="flex flex-col gap-3 px-6 py-6 sm:flex-row">
            <Link
              href={withLocale(locale, "/vault/payouts")}
              className="rounded-xl border border-white/[0.12] bg-white/[0.04] px-5 py-4 text-sm text-opus-warm/80 transition hover:border-opus-gold/35 hover:bg-white/[0.06]"
            >
              {s.toPayouts}
            </Link>
            <Link
              href={withLocale(locale, "/vault/artist-profile")}
              className="rounded-xl border border-white/[0.12] bg-white/[0.04] px-5 py-4 text-sm text-opus-warm/80 transition hover:border-opus-gold/35 hover:bg-white/[0.06]"
            >
              {s.toArtistProfile}
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}

