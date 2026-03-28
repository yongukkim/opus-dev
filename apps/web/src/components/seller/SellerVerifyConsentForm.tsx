"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/types";
import { withLocale } from "@/i18n/paths";

/**
 * ISO 27001 A.18.1.4 (§7) Privacy by Design · APPI
 * KO: 판매자 eKYC 동의는 목적·항목·제3자 제공을 명시하고, 동의 없이 진행하지 않습니다.
 * JA: 出品者eKYCの同意は目的・項目・第三者提供を明示し、未同意では進めません。
 * EN: Seller eKYC consent documents purpose, items, and third-party disclosure; no progression without consent.
 */

function VaultConnectingOverlay({
  open,
  ariaLabel,
  line1,
  line2,
}: {
  open: boolean;
  ariaLabel: string;
  line1: string;
  line2: string;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#040404]/92 px-6 backdrop-blur-[2px]"
      role="alertdialog"
      aria-live="polite"
      aria-busy="true"
      aria-label={ariaLabel}
    >
      <div className="relative h-16 w-16">
        <div
          className="absolute inset-0 rounded-full border border-[#deb892]/25"
          aria-hidden
        />
        <div
          className="absolute inset-0 motion-safe:animate-spin rounded-full border-2 border-transparent border-t-[#c9a97e] border-r-[#c9a97e]/35"
          style={{ animationDuration: "1.1s" }}
          aria-hidden
        />
        <div
          className="absolute inset-[6px] rounded-full border border-[#deb892]/10 opacity-60"
          aria-hidden
        />
      </div>
      <p className="mt-8 max-w-md text-center font-display text-lg font-light tracking-wide text-[#e8dfd2]">
        {line1}
      </p>
      <p className="mt-2 max-w-sm text-center font-sans text-xs font-light leading-relaxed tracking-wide text-[#c9a97e]/65">
        {line2}
      </p>
    </div>
  );
}

function GoldCheckbox({
  checked,
  onToggle,
  id,
}: {
  checked: boolean;
  onToggle: () => void;
  id: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[3px] border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#deb892]/50 ${
        checked
          ? "border-[#b8956a]/90 bg-[linear-gradient(160deg,rgba(222,184,146,0.18),rgba(30,26,22,0.85))] shadow-[0_0_0_1px_rgba(222,184,146,0.12),inset_0_1px_0_rgba(255,255,255,0.07)]"
          : "border-[#5c5348]/80 bg-[#0a0a0a] shadow-[inset_0_1px_2px_rgba(0,0,0,0.45)]"
      }`}
    >
      <svg
        viewBox="0 0 12 12"
        className={`h-3 w-3 text-[#deb892] transition duration-200 ${checked ? "scale-100 opacity-100" : "scale-75 opacity-0"}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M2.5 6l2.5 2.5L9.5 3.5" />
      </svg>
    </button>
  );
}

export type SellerVerifyConsentFormProps = {
  locale: Locale;
  strings: Messages["sellerVerifyConsent"];
};

export function SellerVerifyConsentForm({ locale, strings: s }: SellerVerifyConsentFormProps) {
  const router = useRouter();
  const [agreeCollection, setAgreeCollection] = useState(false);
  const [agreeSensitiveId, setAgreeSensitiveId] = useState(false);
  const [agreeThirdParty, setAgreeThirdParty] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const allChecked = agreeCollection && agreeSensitiveId && agreeThirdParty;

  const handleNext = useCallback(async () => {
    if (!allChecked || connecting) return;
    setConnecting(true);
    try {
      const res = await fetch("/api/seller/verify/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consentCollection: true,
          consentSensitiveId: true,
          consentThirdParty: true,
        }),
      });
      if (!res.ok) {
        setConnecting(false);
        alert(s.alertConsentFail);
        return;
      }
      window.setTimeout(() => {
        router.push(withLocale(locale, "/seller/verify/start"));
      }, 2200);
    } catch {
      setConnecting(false);
      alert(s.alertNetwork);
    }
  }, [allChecked, connecting, locale, router, s.alertConsentFail, s.alertNetwork]);

  return (
    <main className="min-h-screen bg-[#060606] px-5 py-10 text-[#e8e0d4]/88 sm:px-8 sm:py-14 md:px-12 md:py-16 lg:px-16 lg:py-20">
      <VaultConnectingOverlay
        open={connecting}
        ariaLabel={s.overlayAriaLabel}
        line1={s.overlayLine1}
        line2={s.overlayLine2}
      />

      <div className="mx-auto max-w-[40rem]">
        <article
          className="rounded-2xl border border-white/[0.07] bg-[#0a0a0a] px-6 py-10 shadow-[0_24px_80px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.04)] sm:px-10 sm:py-12 md:px-12 md:py-14 lg:px-14 lg:py-16"
          aria-busy={connecting}
        >
          <header className="text-center">
            <p className="font-mono text-[0.6rem] font-light uppercase tracking-[0.42em] text-[#a8987c]/75">
              {s.kicker}
            </p>
            <h1 className="mt-5 font-display text-xl font-light leading-snug tracking-wide text-[#f2ebe3] sm:text-2xl md:text-[1.65rem]">
              {s.title}
            </h1>
            <p className="mt-3 font-display text-sm font-light italic tracking-wide text-[#c9a97e]/80 md:text-base">
              {s.subtitle}
            </p>
          </header>

          <div
            className="opus-seller-verify-uniform"
            data-locale={locale}
          >
            <div className="mt-10 border-l border-[#deb892]/25 pl-5 md:mt-12">
              <p className="text-[0.9375rem] leading-[1.75] tracking-wide text-[#d4cbc0]/88">
                {s.intro}
              </p>
            </div>

            <section className="mt-12 md:mt-14">
              <h2 className="border-b border-white/[0.06] pb-3 font-mono text-[0.65rem] uppercase tracking-[0.28em] text-[#a8987c]/70">
                {s.sectionHeading}
              </h2>
              <ul className="mt-8 space-y-2 sm:space-y-3">
                <li className="w-full">
                  <div className="flex w-full max-w-full items-start gap-3 rounded-xl py-2 pl-1 pr-2 touch-manipulation sm:gap-4 sm:py-2.5">
                    <GoldCheckbox
                      id="chk-collection"
                      checked={agreeCollection}
                      onToggle={() => setAgreeCollection((v) => !v)}
                    />
                    <label
                      htmlFor="chk-collection"
                      className="min-h-[44px] min-w-0 flex-1 cursor-pointer py-1.5 pl-0 leading-[1.7] [-webkit-tap-highlight-color:transparent]"
                    >
                      <span className="text-[0.65rem] uppercase tracking-[0.2em] text-[#c9a97e]/85">
                        {s.requiredBadge}
                      </span>
                      <span className="mt-1 block text-[0.9375rem] text-[#e8e0d4]/90">{s.consentCollection}</span>
                    </label>
                  </div>
                </li>
                <li className="w-full">
                  <div className="flex w-full max-w-full items-start gap-3 rounded-xl py-2 pl-1 pr-2 touch-manipulation sm:gap-4 sm:py-2.5">
                    <GoldCheckbox
                      id="chk-sensitive"
                      checked={agreeSensitiveId}
                      onToggle={() => setAgreeSensitiveId((v) => !v)}
                    />
                    <label
                      htmlFor="chk-sensitive"
                      className="min-h-[44px] min-w-0 flex-1 cursor-pointer py-1.5 pl-0 leading-[1.7] [-webkit-tap-highlight-color:transparent]"
                    >
                      <span className="text-[0.65rem] uppercase tracking-[0.2em] text-[#c9a97e]/85">
                        {s.requiredBadge}
                      </span>
                      <span className="mt-1 block text-[0.9375rem] text-[#e8e0d4]/90">{s.consentSensitive}</span>
                    </label>
                  </div>
                </li>
                <li className="w-full">
                  <div className="flex w-full max-w-full items-start gap-3 rounded-xl py-2 pl-1 pr-2 touch-manipulation sm:gap-4 sm:py-2.5">
                    <GoldCheckbox
                      id="chk-thirdparty"
                      checked={agreeThirdParty}
                      onToggle={() => setAgreeThirdParty((v) => !v)}
                    />
                    <label
                      htmlFor="chk-thirdparty"
                      className="min-h-[44px] min-w-0 flex-1 cursor-pointer py-1.5 pl-0 leading-[1.7] [-webkit-tap-highlight-color:transparent]"
                    >
                      <span className="text-[0.65rem] uppercase tracking-[0.2em] text-[#c9a97e]/85">
                        {s.requiredBadge}
                      </span>
                      <span className="mt-1 block text-[0.9375rem] text-[#e8e0d4]/90">{s.consentThirdParty}</span>
                    </label>
                  </div>
                </li>
              </ul>
            </section>

            <p className="mt-10 text-center text-[0.7rem] leading-relaxed text-[#6d655a]/90">{s.dbNote}</p>
          </div>

          <div className="mt-12 flex flex-col-reverse gap-4 sm:mt-14 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={connecting}
              className="rounded-xl border border-[#5c5348]/55 bg-transparent px-6 py-3.5 text-center text-sm font-light tracking-[0.12em] text-[#c9a97e]/75 transition hover:border-[#deb892]/35 hover:text-[#deb892] disabled:opacity-40"
            >
              {s.back}
            </button>
            <button
              type="button"
              disabled={!allChecked || connecting}
              onClick={handleNext}
              className="opus-surface-metallic rounded-xl px-8 py-3.5 text-sm font-normal tracking-[0.14em] text-[#0a0a0a] transition disabled:cursor-not-allowed disabled:opacity-35"
            >
              {s.next}
            </button>
          </div>

          <p className="mt-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center text-[0.65rem] font-light text-[#5c5348]/95">
            <Link href="/docs/privacy-policy.md" className="text-[#9a8f7e]/80 hover:text-[#c9a97e]">
              {s.footerPrivacyMd}
            </Link>
            <span className="text-[#4a433c]">·</span>
            <Link href={withLocale(locale, "/privacy")} className="text-[#9a8f7e]/80 hover:text-[#c9a97e]">
              {s.footerPrivacy}
            </Link>
            <span className="text-[#4a433c]">·</span>
            <Link href={withLocale(locale, "/vault")} className="text-[#9a8f7e]/80 hover:text-[#c9a97e]">
              {s.footerVault}
            </Link>
          </p>
        </article>
      </div>
    </main>
  );
}
