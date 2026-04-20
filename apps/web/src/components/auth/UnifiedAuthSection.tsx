"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { AuthConsentBlock } from "@/components/auth/AuthConsentBlock";
import { SsoProviderButtons } from "@/components/auth/SsoProviderButtons";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/types";
import type { OAuthConsentFlow } from "@/lib/oauthConsentCookie";

/**
 * Google OAuth + mandatory APPI consent gates (other providers: UI only until wired).
 */
export function UnifiedAuthSection({
  variant,
  locale,
  returnTo,
  googleOAuthConfigured,
  termsHref,
  privacyHref,
  termsLabel,
  privacyLabel,
  m,
}: {
  variant: OAuthConsentFlow;
  locale: Locale;
  returnTo: string;
  googleOAuthConfigured: boolean;
  termsHref: string;
  privacyHref: string;
  termsLabel: string;
  privacyLabel: string;
  m: Messages;
}) {
  const [termsPrivacy, setTermsPrivacy] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [pending, setPending] = useState(false);

  const allRequired = termsPrivacy && ageConfirmed;
  const ssoInactive = !allRequired || pending || !googleOAuthConfigured;

  // ISO 27001 A.18.1.4 (§7) — PIPA §28-8 / APPI §28
  // KO: 이용약관·개인정보처리방침 동의에 Google LLC(미국) 국외이전이 포함되므로
  //     precheck 쿠키에도 overseasAccepted=true 를 함께 기록한다(개인정보처리방침 본문과 체크박스 문구 모두에 명시).
  // JA: 利用規約・プライバシーポリシーへの同意に米国 Google LLC への国外移転を含めるため、
  //     precheck クッキーにも overseasAccepted=true を合わせて記録する。
  // EN: The Terms + Privacy consent explicitly covers cross-border transfer to Google LLC (US),
  //     so overseasAccepted=true is recorded alongside the other flags.
  async function runPrecheck(): Promise<boolean> {
    const res = await fetch("/api/auth/oauth-precheck", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        flow: variant,
        locale,
        termsAccepted: true,
        privacyAccepted: true,
        overseasAccepted: true,
        adultAccepted: true,
        marketingAccepted: marketing,
      }),
    });
    return res.ok;
  }

  async function handleGoogle() {
    if (!googleOAuthConfigured) {
      window.alert(m.auth.googleNotConfiguredAlert);
      return;
    }
    if (!allRequired) {
      window.alert(m.auth.consentRequiredAlert);
      return;
    }
    if (pending) return;
    setPending(true);
    try {
      const ok = await runPrecheck();
      if (!ok) {
        window.alert(m.auth.consentPrecheckFailedAlert);
        return;
      }
      await signIn("google", { callbackUrl: returnTo });
    } catch {
      window.alert(m.auth.consentPrecheckFailedAlert);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-10 space-y-5">
      <AuthConsentBlock
        termsHref={termsHref}
        privacyHref={privacyHref}
        termsLabel={termsLabel}
        privacyLabel={privacyLabel}
        strings={{
          termsPrivacyLead: m.auth.consentTermsPrivacyLead,
          termsPrivacyMid: m.auth.consentTermsPrivacyMid,
          termsPrivacyEnd: m.auth.consentTermsPrivacyEnd,
          marketingCheckbox: m.auth.consentMarketingCheckbox,
          ageCheckbox: m.auth.ageCheckbox,
        }}
        termsPrivacy={termsPrivacy}
        onTermsPrivacyChange={setTermsPrivacy}
        marketing={marketing}
        onMarketingChange={setMarketing}
        ageConfirmed={ageConfirmed}
        onAgeConfirmedChange={setAgeConfirmed}
      />

      <SsoProviderButtons
        strings={{
          continueWithApple: m.auth.continueWithApple,
          continueWithGoogle: m.auth.continueWithGoogle,
          continueWithLine: m.auth.continueWithLine,
          hintSoon: m.auth.hintSoon,
          hintActive: m.auth.hintActive,
        }}
        googleInactive={ssoInactive}
        appleInactive
        lineInactive
        onGoogleClick={handleGoogle}
        onAppleClick={() => {}}
        onLineClick={() => {}}
      />
    </div>
  );
}
