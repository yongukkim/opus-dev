"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import type { Locale } from "@/i18n/config";
import { withLocale } from "@/i18n/paths";

/**
 * ISO 27001 A.9.4.2 (§2) — sign-out clears the Auth.js session cookie via the library (no custom token handling here).
 * KO: 로그아웃은 Auth.js signOut으로만 처리한다.
 * JA: サインアウトはAuth.jsのsignOutのみで行う。
 * EN: Sign-out uses Auth.js `signOut` only.
 */
export function SiteHeaderAuth({
  locale,
  signInLabel,
  signUpLabel,
  signOutLabel,
  userEmail,
}: {
  locale: Locale;
  signInLabel: string;
  signUpLabel: string;
  signOutLabel: string;
  userEmail: string | null | undefined;
}) {
  const ja = locale === "ja";
  const linkClass = ja
    ? "hidden shrink-0 font-mono text-[0.65rem] tracking-tight break-keep text-opus-warm/55 transition hover:text-opus-gold sm:inline"
    : "hidden shrink-0 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-opus-warm/55 transition hover:text-opus-gold sm:inline";

  if (userEmail) {
    return (
      <>
        <span
          className={`hidden max-w-[10rem] truncate sm:inline ${ja ? "font-mono text-[0.65rem] tracking-tight text-opus-warm/50" : "font-mono text-[0.65rem] uppercase tracking-[0.18em] text-opus-warm/50"}`}
          title={userEmail}
        >
          {userEmail}
        </span>
        <button
          type="button"
          onClick={() => void signOut({ callbackUrl: withLocale(locale, "/") })}
          className={`${linkClass} cursor-pointer border-0 bg-transparent p-0 text-left`}
        >
          {signOutLabel}
        </button>
      </>
    );
  }

  return (
    <>
      <Link href={withLocale(locale, "/login")} className={linkClass}>
        {signInLabel}
      </Link>
      <Link href={withLocale(locale, "/signup")} className={linkClass}>
        {signUpLabel}
      </Link>
    </>
  );
}
