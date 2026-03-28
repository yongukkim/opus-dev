"use client";

import Link from "next/link";
import { useId } from "react";

export type AuthConsentStrings = {
  preamble: string;
  between: string;
  conclude: string;
  ageCheckbox: string;
};

type Props = {
  termsHref: string;
  privacyHref: string;
  termsLabel: string;
  privacyLabel: string;
  strings: AuthConsentStrings;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
};

/**
 * ISO 27001 A.18.1.4 (§7) Privacy by Design
 * KO: 만 18세 확인 및 약관·개인정보 동의를 SSO/가입 전에 명시적으로 받습니다.
 * JA: SSO/登録前に成年確認と規約・プライバシーへの同意を明示的に取得します。
 * EN: Age confirmation and terms/privacy consent are collected before SSO or registration.
 */
export function AuthConsentBlock({
  termsHref,
  privacyHref,
  termsLabel,
  privacyLabel,
  strings,
  checked,
  onCheckedChange,
}: Props) {
  const id = useId();
  const inputId = `${id}-age`;

  return (
    <div className="space-y-4 rounded-xl border border-white/[0.08] bg-black/20 px-4 py-4">
      <p className="text-center text-[0.8125rem] leading-relaxed text-opus-warm/62">
        {strings.preamble}
        <Link
          href={termsHref}
          className="text-opus-gold underline decoration-opus-gold/35 underline-offset-2 transition hover:text-opus-gold-light hover:decoration-opus-gold-light/50"
        >
          {termsLabel}
        </Link>
        {strings.between}
        <Link
          href={privacyHref}
          className="text-opus-gold underline decoration-opus-gold/35 underline-offset-2 transition hover:text-opus-gold-light hover:decoration-opus-gold-light/50"
        >
          {privacyLabel}
        </Link>
        {strings.conclude}
      </p>

      <div className="flex justify-center">
        <label
          htmlFor={inputId}
          className="group flex max-w-md cursor-pointer items-start gap-3 text-left"
        >
          <span className="relative mt-0.5 inline-flex h-[1.125rem] w-[1.125rem] shrink-0">
            <input
              id={inputId}
              type="checkbox"
              checked={checked}
              onChange={(e) => onCheckedChange(e.target.checked)}
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
            <span className="font-medium text-opus-warm/88">{strings.ageCheckbox}</span>
          </span>
        </label>
      </div>
    </div>
  );
}
