"use client";

import Link from "next/link";
import { useId } from "react";

export type AuthConsentStrings = {
  /** Line before Terms link (e.g. "I agree to the ") */
  termsPrivacyLead: string;
  /** Between Terms and Privacy links (e.g. " and the ") */
  termsPrivacyMid: string;
  /** After Privacy link. Must disclose the cross-border transfer recipient (Google LLC, US). */
  termsPrivacyEnd: string;
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
      className="group flex w-full cursor-pointer items-start gap-3 text-left"
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
 * ISO 27001 A.18.1.4 (§7) Privacy by Design — consent capture
 * KO: 이용약관·개인정보처리방침(Google LLC 국외 이전 포함)·만 18세 이상 필수 동의와 선택 마케팅을
 *     OAuth 이전 단계에서 받아 DB에 시각·버전과 함께 기록한다. 국외이전 조항은 문구와
 *     개인정보처리방침 본문 양쪽에 명시된다.
 * JA: 利用規約・プライバシーポリシー（米国 Google LLC への移転を含む）・18歳以上の必須同意と、
 *     任意のマーケティング同意を OAuth 前に取得し、DB に時刻とバージョンで記録する。
 *     国外移転条項は文言とプライバシーポリシー本文の両方で明示する。
 * EN: Capture the required consents (Terms + Privacy, the latter explicitly covering cross-border
 *     transfer to Google LLC in the US, plus 18+ attestation) and the optional marketing opt-in
 *     before OAuth, persisting timestamps and versions in the database.
 */
export function AuthConsentBlock({
  termsHref,
  privacyHref,
  termsLabel,
  privacyLabel,
  strings,
  termsPrivacy,
  onTermsPrivacyChange,
  marketing,
  onMarketingChange,
  ageConfirmed,
  onAgeConfirmedChange,
}: Props) {
  const id = useId();

  return (
    <div className="space-y-4 rounded-xl border border-white/[0.08] bg-black/20 px-4 py-4">
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

      <ConsentCheckbox id={`${id}-age`} checked={ageConfirmed} onChange={onAgeConfirmedChange}>
        <span className="font-medium text-opus-warm/88">{strings.ageCheckbox}</span>
      </ConsentCheckbox>

      <ConsentCheckbox id={`${id}-mkt`} checked={marketing} onChange={onMarketingChange}>
        <span className="text-opus-warm/80">{strings.marketingCheckbox}</span>
      </ConsentCheckbox>
    </div>
  );
}
