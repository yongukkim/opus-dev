"use client";

import Link from "next/link";
import { useId } from "react";

export type AuthConsentStrings = {
  /** Line before Terms link (e.g. "I agree to the ") */
  termsPrivacyLead: string;
  /** Between Terms and Privacy links (e.g. " and the ") */
  termsPrivacyMid: string;
  /** After Privacy link (e.g. ".") */
  termsPrivacyEnd: string;
  overseasCheckbox: string;
  /** Optional marketing opt-in */
  marketingCheckbox: string;
  ageCheckbox: string;
};

type Props = {
  termsHref: string;
  privacyHref: string;
  termsLabel: string;
  privacyLabel: string;
  strings: AuthConsentStrings;
  termsPrivacy: boolean;
  onTermsPrivacyChange: (next: boolean) => void;
  overseas: boolean;
  onOverseasChange: (next: boolean) => void;
  marketing: boolean;
  onMarketingChange: (next: boolean) => void;
  ageConfirmed: boolean;
  onAgeConfirmedChange: (next: boolean) => void;
};

function ConsentCheckbox({
  id,
  checked,
  onChange,
  children,
}: {
  id: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={id}
      className="group flex max-w-xl cursor-pointer items-start gap-3 text-left"
    >
      <span className="relative mt-0.5 inline-flex h-[1.125rem] w-[1.125rem] shrink-0">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer absolute inset-0 z-10 h-[1.125rem] w-[1.125rem] cursor-pointer opacity-0"
          aria-required="true"
        />
        <span
          className="pointer-events-none flex h-[1.125rem] w-[1.125rem] items-center justify-center rounded-sm border border-white/[0.2] bg-[#0c0c0c] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#deb892]/55 peer-checked:border-[#c9a97e]/85 peer-checked:bg-[linear-gradient(145deg,rgba(222,184,146,0.14),rgba(42,36,30,0.5))] peer-checked:shadow-[0_0_0_1px_rgba(222,184,146,0.12),inset_0_1px_0_rgba(255,255,255,0.06)] peer-checked:[&_svg]:opacity-100"
          aria-hidden
        >
          <svg
            viewBox="0 0 12 12"
            className="h-2.5 w-2.5 text-[#deb892] opacity-0 transition"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2.5 6l2.5 2.5L9.5 3.5" />
          </svg>
        </span>
      </span>
      <span className="font-sans text-sm leading-snug text-opus-warm/78 group-hover:text-opus-warm/88">
        {children}
      </span>
    </label>
  );
}

/**
 * ISO 27001 A.18.1.4 (§7) Privacy by Design
 * KO: OAuth 전에 약관·개인정보·국외이전·(선택)마케팅·만 18세 이상 확인을 분리해 기록한다.
 * JA: OAuth前に規約・プライバシー・国外移転・(任意)マーケ・成年を分けて取得する。
 * EN: Capture Terms, Privacy, cross-border transfer, optional marketing, and 18+ attestation before OAuth.
 */
export function AuthConsentBlock({
  termsHref,
  privacyHref,
  termsLabel,
  privacyLabel,
  strings,
  termsPrivacy,
  onTermsPrivacyChange,
  overseas,
  onOverseasChange,
  marketing,
  onMarketingChange,
  ageConfirmed,
  onAgeConfirmedChange,
}: Props) {
  const id = useId();

  return (
    <div className="space-y-4 rounded-xl border border-white/[0.08] bg-black/20 px-4 py-4">
      <div className="flex justify-center">
        <ConsentCheckbox
          id={`${id}-terms`}
          checked={termsPrivacy}
          onChange={onTermsPrivacyChange}
        >
          <span className="font-medium text-opus-warm/88">
            {strings.termsPrivacyLead}
            <Link
              href={termsHref}
              className="text-opus-gold underline decoration-opus-gold/35 underline-offset-2 transition hover:text-opus-gold-light hover:decoration-opus-gold-light/50"
            >
              {termsLabel}
            </Link>
            {strings.termsPrivacyMid}
            <Link
              href={privacyHref}
              className="text-opus-gold underline decoration-opus-gold/35 underline-offset-2 transition hover:text-opus-gold-light hover:decoration-opus-gold-light/50"
            >
              {privacyLabel}
            </Link>
            {strings.termsPrivacyEnd}
          </span>
        </ConsentCheckbox>
      </div>

      <div className="flex justify-center">
        <ConsentCheckbox id={`${id}-overseas`} checked={overseas} onChange={onOverseasChange}>
          <span className="font-medium text-opus-warm/88">{strings.overseasCheckbox}</span>
        </ConsentCheckbox>
      </div>

      <div className="flex justify-center">
        <ConsentCheckbox id={`${id}-mkt`} checked={marketing} onChange={onMarketingChange}>
          <span className="text-opus-warm/80">{strings.marketingCheckbox}</span>
        </ConsentCheckbox>
      </div>

      <div className="flex justify-center">
        <ConsentCheckbox id={`${id}-age`} checked={ageConfirmed} onChange={onAgeConfirmedChange}>
          <span className="font-medium text-opus-warm/88">{strings.ageCheckbox}</span>
        </ConsentCheckbox>
      </div>
    </div>
  );
}
