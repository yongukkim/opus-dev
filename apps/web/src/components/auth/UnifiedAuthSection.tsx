"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { AuthConsentBlock } from "@/components/auth/AuthConsentBlock";
import { SsoProviderButtons } from "@/components/auth/SsoProviderButtons";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/types";
import type { OAuthConsentFlow } from "@/lib/oauthConsentCookie";

/**
 * Google OAuth with APPI consent gates.
 *
 * variant="signup" | "artist-signup":
 *   Render mandatory consent checkboxes (ToS + Privacy, 18+). Optional marketing.
 *   POST the consent payload to /api/auth/oauth-precheck to obtain a signed
 *   short-lived cookie that `auth.ts`'s `createUser` event reads into the DB
 *   (`tosAcceptedAt`, `privacyAcceptedAt`, `overseasTransferAcceptedAt`, …).
 *
 * variant="login":
 *   No consent UI. A returning visitor already has those timestamps stored at
 *   signup time; asking again adds zero legal value and only costs UX. If the
 *   email is NOT yet in our DB, `auth.ts#signIn` will detect the missing
 *   consent cookie and redirect to /signup?error=oauth_consent_required.
 *
 *   TODO: when OPUS_TERMS_VERSION / OPUS_PRIVACY_VERSION change we must add a
 *   re-consent prompt comparing the stored `tosVersionAccepted` /
 *   `privacyVersionAccepted`. Out of scope for this change.
 *
 * ISO 27001 A.18.1.4 (§7 APPI / PIPA §28-8 ②항)
 * KO: 로그인은 재방문 이벤트 — 동의는 가입 때 이미 타임스탬프로 기록됨.
 * JA: ログインは再訪イベント — 同意は登録時に既に記録済み。
 * EN: Login is a return event — consent timestamps were captured at signup.
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
  const isLogin = variant === "login";

  const [termsPrivacy, setTermsPrivacy] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [pending, setPending] = useState(false);

  const consentSatisfied = isLogin ? true : termsPrivacy && ageConfirmed;
  const ssoInactive = !consentSatisfied || pending || !googleOAuthConfigured;

  // ISO 27001 A.18.1.4 (§7) — PIPA §28-8 / APPI §28
  // KO: 이용약관·개인정보처리방침 동의에 Google LLC(미국) 국외이전이 포함되므로
  //     precheck 쿠키에도 overseasAccepted=true 를 함께 기록한다(개인정보처리방침 본문에 명시).
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
    if (!consentSatisfied) {
      window.alert(m.auth.consentRequiredAlert);
      return;
    }
    if (pending) return;
    setPending(true);
    try {
      if (!isLogin) {
        const ok = await runPrecheck();
        if (!ok) {
          window.alert(m.auth.consentPrecheckFailedAlert);
          return;
        }
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
      {!isLogin && (
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
      )}

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
