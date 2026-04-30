"use client";

import { useEffect, useState } from "react";
import type { Messages } from "@/i18n/types";

function labelClass(): string {
  return "block font-mono text-[0.65rem] uppercase tracking-[0.22em] text-opus-warm/45";
}

function inputClass(): string {
  return "mt-2 w-full rounded-xl border border-white/[0.12] bg-black/25 px-4 py-3 text-sm text-opus-warm/85 outline-none transition focus:border-opus-gold/45 focus:ring-2 focus:ring-opus-gold/20";
}

export type PayoutBankAccountFormVariant = "accountSettings" | "payoutsArtist" | "payoutsCollector";

/**
 * ISO 27001 A.9.2.1 (§4), A.18.1.4 (§7)
 * KO: 로그인 본인의 정산 계좌 메타만 `/api/account/payout-bank`로 읽고 저장합니다.
 * JA: ログイン本人の精算口座メタのみ `/api/account/payout-bank` で読み書きします。
 * EN: Read/write payout bank metadata only for the signed-in user via `/api/account/payout-bank`.
 */
export function PayoutBankAccountForm({
  m,
  variant,
}: {
  m: Messages;
  variant: PayoutBankAccountFormVariant;
}) {
  const p = m.payouts;
  const s = m.accountSettings;

  const heading = variant === "accountSettings" ? s.payoutBankHeading : p.heading;
  const body =
    variant === "accountSettings"
      ? s.payoutBankBody
      : variant === "payoutsCollector"
        ? p.collectorCardBody
        : p.body;

  const saveCta = variant === "accountSettings" ? s.payoutBankSaveCta : p.saveCta;
  const savingCta = variant === "accountSettings" ? s.payoutBankSavingCta : p.savingCta;
  const savedBanner = variant === "accountSettings" ? s.payoutBankSaved : p.savedBanner;
  const errorBanner = variant === "accountSettings" ? s.payoutBankError : p.saveFailedBanner;
  const loadErrorBanner = variant === "accountSettings" ? s.payoutBankLoadError : p.loadFailedBanner;

  const bankNameLabel = variant === "accountSettings" ? s.bankNameLabel : p.bankNameLabel;
  const bankNamePlaceholder = variant === "accountSettings" ? s.bankNamePlaceholder : p.bankNamePlaceholder;
  const accountHolderLabel = variant === "accountSettings" ? s.accountHolderLabel : p.accountHolderLabel;
  const accountHolderPlaceholder =
    variant === "accountSettings" ? s.accountHolderPlaceholder : p.accountHolderPlaceholder;
  const accountNumberLabel = variant === "accountSettings" ? s.accountNumberLabel : p.accountNumberLabel;
  const accountNumberPlaceholder =
    variant === "accountSettings" ? s.accountNumberPlaceholder : p.accountNumberPlaceholder;

  const [bankName, setBankName] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadError("");
      try {
        const res = await fetch("/api/account/payout-bank", { method: "GET" });
        if (cancelled) return;
        if (!res.ok) {
          setLoadError(loadErrorBanner);
          return;
        }
        const j = (await res.json()) as {
          ok?: boolean;
          bank?: { bankName?: string; accountHolder?: string; accountNumber?: string };
        };
        if (j.bank) {
          setBankName(j.bank.bankName ?? "");
          setAccountHolder(j.bank.accountHolder ?? "");
          setAccountNumber(j.bank.accountNumber ?? "");
        }
      } catch {
        if (!cancelled) setLoadError(loadErrorBanner);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadErrorBanner]);

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-opus-slate/20 shadow-opus-card">
      <div className="border-b border-white/[0.06] px-6 py-6">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-opus-warm/45">{heading}</p>
        <p className="mt-4 text-sm leading-relaxed text-opus-warm/60">{body}</p>
      </div>
      <form
        className="space-y-4 px-6 py-6"
        onSubmit={async (e) => {
          e.preventDefault();
          if (saving) return;
          setError("");
          setSuccess(false);
          setSaving(true);
          try {
            const res = await fetch("/api/account/payout-bank", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                bankName: bankName.trim(),
                accountHolder: accountHolder.trim(),
                accountNumber: accountNumber.replace(/\D/g, ""),
              }),
            });
            if (!res.ok) {
              setError(errorBanner);
              return;
            }
            const j = (await res.json()) as {
              bank?: { bankName?: string; accountHolder?: string; accountNumber?: string };
            };
            if (j.bank) {
              setBankName(j.bank.bankName ?? "");
              setAccountHolder(j.bank.accountHolder ?? "");
              setAccountNumber(j.bank.accountNumber ?? "");
            }
            setSuccess(true);
            window.setTimeout(() => setSuccess(false), 2800);
          } catch {
            setError(errorBanner);
          } finally {
            setSaving(false);
          }
        }}
      >
        {loadError ? <p className="text-xs text-amber-200/80">{loadError}</p> : null}
        {success ? <p className="text-xs text-emerald-200/85">{savedBanner}</p> : null}
        <label className="block">
          <span className={labelClass()}>{bankNameLabel}</span>
          <input
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            className={inputClass()}
            placeholder={bankNamePlaceholder}
            autoComplete="organization"
          />
        </label>
        <label className="block">
          <span className={labelClass()}>{accountHolderLabel}</span>
          <input
            value={accountHolder}
            onChange={(e) => setAccountHolder(e.target.value)}
            className={inputClass()}
            placeholder={accountHolderPlaceholder}
            autoComplete="name"
          />
        </label>
        <label className="block">
          <span className={labelClass()}>{accountNumberLabel}</span>
          <input
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            className={inputClass()}
            placeholder={accountNumberPlaceholder}
            autoComplete="off"
            inputMode="numeric"
          />
          {variant !== "accountSettings" ? (
            <p className="mt-2 text-xs leading-relaxed text-opus-warm/45">{p.accountNumberHint}</p>
          ) : null}
        </label>
        {error ? <p className="text-xs text-red-200/85">{error}</p> : null}
        <button
          type="submit"
          disabled={saving}
          className="opus-surface-metallic inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold tracking-[0.12em] text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? savingCta : saveCta}
        </button>
        {variant !== "accountSettings" ? (
          <p className="text-center text-xs text-opus-warm/45">{p.note}</p>
        ) : null}
      </form>
    </div>
  );
}
