"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/types";
import { withLocale } from "@/i18n/paths";
import { PayoutBankAccountForm } from "@/components/account/PayoutBankAccountForm";

function labelClass(): string {
  return "block font-mono text-[0.65rem] uppercase tracking-[0.22em] text-opus-warm/45";
}

function inputClass(): string {
  return "mt-2 w-full rounded-xl border border-white/[0.12] bg-black/25 px-4 py-3 text-sm text-opus-warm/85 outline-none transition focus:border-opus-gold/45 focus:ring-2 focus:ring-opus-gold/20";
}

function selectClass(): string {
  return inputClass();
}

export function AccountSettingsPanel({ locale, m }: { locale: Locale; m: Messages }) {
  const s = m.accountSettings;
  const [saved, setSaved] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const mismatch = newPassword.length > 0 && confirmPassword.length > 0 && newPassword !== confirmPassword;
  const [withdrawConfirmText, setWithdrawConfirmText] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");

  const [cardholderName, setCardholderName] = useState("");
  const [cardBrand, setCardBrand] = useState("visa");
  const [cardLast4, setCardLast4] = useState("");
  const [cardExpMonth, setCardExpMonth] = useState(1);
  const [cardExpYear, setCardExpYear] = useState(new Date().getFullYear() + 1);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentLoadError, setPaymentLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPaymentLoadError("");
      try {
        const payRes = await fetch("/api/account/payment-method", { method: "GET" });
        if (cancelled) return;
        if (payRes.ok) {
          const j = (await payRes.json()) as {
            ok?: boolean;
            method?: {
              cardholderName?: string;
              brand?: string;
              last4?: string;
              expMonth?: number;
              expYear?: number;
            } | null;
          };
          if (j.method) {
            setCardholderName(j.method.cardholderName ?? "");
            if (j.method.brand) setCardBrand(j.method.brand);
            setCardLast4(j.method.last4 ?? "");
            if (typeof j.method.expMonth === "number") setCardExpMonth(j.method.expMonth);
            if (typeof j.method.expYear === "number") setCardExpYear(j.method.expYear);
          }
        } else {
          setPaymentLoadError(s.paymentMethodLoadError);
        }
      } catch {
        if (!cancelled) {
          setPaymentLoadError(s.paymentMethodLoadError);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [locale, s.paymentMethodLoadError]);

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

      <PayoutBankAccountForm m={m} variant="accountSettings" />

      <section className="overflow-hidden rounded-xl border border-white/[0.08] bg-opus-slate/20 shadow-opus-card">
        <div className="border-b border-white/[0.06] px-6 py-6">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-opus-warm/45">
            {s.paymentMethodHeading}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-opus-warm/60">{s.paymentMethodBody}</p>
        </div>
        <form
          className="space-y-4 px-6 py-6"
          onSubmit={async (e) => {
            e.preventDefault();
            if (paymentSaving) return;
            setPaymentError("");
            setPaymentSuccess(false);
            setPaymentSaving(true);
            try {
              const res = await fetch("/api/account/payment-method", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  cardholderName: cardholderName.trim(),
                  brand: cardBrand,
                  last4: cardLast4.replace(/\D/g, ""),
                  expMonth: cardExpMonth,
                  expYear: cardExpYear,
                }),
              });
              if (!res.ok) {
                setPaymentError(s.paymentMethodError);
                return;
              }
              const j = (await res.json()) as {
                method?: {
                  cardholderName?: string;
                  brand?: string;
                  last4?: string;
                  expMonth?: number;
                  expYear?: number;
                };
              };
              if (j.method) {
                setCardholderName(j.method.cardholderName ?? "");
                if (j.method.brand) setCardBrand(j.method.brand);
                setCardLast4(j.method.last4 ?? "");
                if (typeof j.method.expMonth === "number") setCardExpMonth(j.method.expMonth);
                if (typeof j.method.expYear === "number") setCardExpYear(j.method.expYear);
              }
              setPaymentSuccess(true);
              window.setTimeout(() => setPaymentSuccess(false), 2800);
            } catch {
              setPaymentError(s.paymentMethodError);
            } finally {
              setPaymentSaving(false);
            }
          }}
        >
          {paymentLoadError ? <p className="text-xs text-amber-200/80">{paymentLoadError}</p> : null}
          {paymentSuccess ? (
            <p className="text-xs text-emerald-200/85">{s.paymentMethodSaved}</p>
          ) : null}
          <label className="block">
            <span className={labelClass()}>{s.cardholderNameLabel}</span>
            <input
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              className={inputClass()}
              placeholder={s.cardholderNamePlaceholder}
              autoComplete="cc-name"
            />
          </label>
          <label className="block">
            <span className={labelClass()}>{s.brandLabel}</span>
            <select
              value={cardBrand}
              onChange={(e) => setCardBrand(e.target.value)}
              className={selectClass()}
              autoComplete="cc-type"
            >
              <option value="visa">{s.brandVisa}</option>
              <option value="mastercard">{s.brandMastercard}</option>
              <option value="amex">{s.brandAmex}</option>
              <option value="jcb">{s.brandJcb}</option>
              <option value="diners">{s.brandDiners}</option>
              <option value="unionpay">{s.brandUnionpay}</option>
              <option value="other">{s.brandOther}</option>
            </select>
          </label>
          <label className="block">
            <span className={labelClass()}>{s.last4Label}</span>
            <input
              value={cardLast4}
              onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className={inputClass()}
              placeholder={s.last4Placeholder}
              autoComplete="off"
              inputMode="numeric"
              maxLength={4}
            />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className={labelClass()}>{s.expMonthLabel}</span>
              <select
                value={String(cardExpMonth)}
                onChange={(e) => setCardExpMonth(Number.parseInt(e.target.value, 10))}
                className={selectClass()}
                autoComplete="cc-exp-month"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={String(m)}>
                    {String(m).padStart(2, "0")}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={labelClass()}>{s.expYearLabel}</span>
              <select
                value={String(cardExpYear)}
                onChange={(e) => setCardExpYear(Number.parseInt(e.target.value, 10))}
                className={selectClass()}
                autoComplete="cc-exp-year"
              >
                {Array.from({ length: 16 }, (_, i) => new Date().getFullYear() + i).map((y) => (
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {paymentError ? <p className="text-xs text-red-200/85">{paymentError}</p> : null}
          <button
            type="submit"
            disabled={paymentSaving}
            className="opus-surface-metallic inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold tracking-[0.12em] text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {paymentSaving ? s.paymentMethodSavingCta : s.paymentMethodSaveCta}
          </button>
        </form>
      </section>

      <section className="overflow-hidden rounded-xl border border-red-300/20 bg-red-950/10 shadow-opus-card">
        <div className="border-b border-red-200/20 px-6 py-6">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-red-100/75">{s.withdrawHeading}</p>
          <p className="mt-4 text-sm leading-relaxed text-red-100/80">{s.withdrawBody}</p>
        </div>
        <form
          className="space-y-4 px-6 py-6"
          onSubmit={async (e) => {
            e.preventDefault();
            if (withdrawing) return;
            setWithdrawError("");
            if (withdrawConfirmText.trim() !== "DELETE") {
              setWithdrawError(s.withdrawConfirmMismatch);
              return;
            }
            setWithdrawing(true);
            try {
              const res = await fetch("/api/account/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ confirmText: withdrawConfirmText.trim() }),
              });
              if (!res.ok) {
                setWithdrawError(s.withdrawFailed);
                return;
              }
              await signOut({ callbackUrl: withLocale(locale, "/") });
            } catch {
              setWithdrawError(s.withdrawFailed);
            } finally {
              setWithdrawing(false);
            }
          }}
        >
          <label className="block">
            <span className={labelClass()}>{s.withdrawConfirmLabel}</span>
            <input
              value={withdrawConfirmText}
              onChange={(e) => setWithdrawConfirmText(e.target.value)}
              className={inputClass()}
              placeholder={s.withdrawConfirmPlaceholder}
              autoComplete="off"
            />
          </label>
          {withdrawError ? <p className="text-xs text-red-200/85">{withdrawError}</p> : null}
          <button
            type="submit"
            disabled={withdrawing}
            className="inline-flex w-full items-center justify-center rounded-xl border border-red-200/40 bg-red-500/20 px-5 py-3 text-sm font-semibold tracking-[0.12em] text-red-100 transition hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {withdrawing ? s.withdrawingCta : s.withdrawCta}
          </button>
        </form>
      </section>
    </div>
  );
}

