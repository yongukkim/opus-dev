"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthConsentBlock } from "@/components/auth/AuthConsentBlock";
import { SsoProviderButtons } from "@/components/auth/SsoProviderButtons";
import { EmailLoginPanel } from "@/components/auth/EmailLoginPanel";
import { SignupPanel } from "@/components/auth/SignupPanel";
import type { Messages } from "@/i18n/types";

/**
 * Single-page auth: shared consent + SNS + divider + email path (no route / mode toggle).
 */
export function UnifiedAuthSection({
  variant,
  returnTo,
  termsHref,
  privacyHref,
  termsLabel,
  privacyLabel,
  m,
}: {
  variant: "login" | "signup";
  returnTo: string;
  termsHref: string;
  privacyHref: string;
  termsLabel: string;
  privacyLabel: string;
  m: Messages;
}) {
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleSsoClick() {
    if (!ageConfirmed) {
      window.alert(m.auth.consentRequiredAlert);
      return;
    }
    if (pending) return;
    setPending(true);
    try {
      const res = await fetch("/api/auth/demo-session", { method: "POST" });
      if (!res.ok) {
        window.alert(m.auth.ssoNotReadyAlert);
        return;
      }
      router.push(returnTo);
      router.refresh();
    } catch {
      window.alert(m.auth.ssoNotReadyAlert);
    } finally {
      setPending(false);
    }
  }

  const ssoInactive = !ageConfirmed || pending;

  return (
    <div className="mt-10 space-y-5">
      <AuthConsentBlock
        termsHref={termsHref}
        privacyHref={privacyHref}
        termsLabel={termsLabel}
        privacyLabel={privacyLabel}
        strings={{
          preamble: m.auth.consentPreamble,
          between: m.auth.consentBetween,
          conclude: m.auth.consentConclude,
          ageCheckbox: m.auth.ageCheckbox,
        }}
        checked={ageConfirmed}
        onCheckedChange={setAgeConfirmed}
      />

      <SsoProviderButtons
        strings={{
          continueWithApple: m.auth.continueWithApple,
          continueWithGoogle: m.auth.continueWithGoogle,
          continueWithLine: m.auth.continueWithLine,
          hint: m.auth.hintSoon,
        }}
        inactive={ssoInactive}
        onSsoClick={handleSsoClick}
      />

      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/[0.08]" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-opus-charcoal px-3 font-mono text-[0.65rem] uppercase tracking-[0.28em] text-opus-warm/45">
            {m.auth.emailDividerLabel}
          </span>
        </div>
      </div>

      {variant === "login" ? (
        <EmailLoginPanel
          returnTo={returnTo}
          sharedConsent={{ ageConfirmed }}
          strings={{
            emailLabel: m.auth.emailLabel,
            passwordLabel: m.auth.passwordLabel,
            signIn: m.auth.signIn,
            consentRequiredAlert: m.auth.consentRequiredAlert,
            sessionNotReadyAlert: m.auth.ssoNotReadyAlert,
          }}
        />
      ) : (
        <SignupPanel
          termsHref={termsHref}
          privacyHref={privacyHref}
          termsLabel={termsLabel}
          privacyLabel={privacyLabel}
          returnTo={returnTo}
          sharedConsent={{ ageConfirmed }}
          strings={{
            displayNameLabel: m.signup.displayNameLabel,
            emailLabel: m.signup.emailLabel,
            passwordLabel: m.signup.passwordLabel,
            passwordConfirmLabel: m.signup.passwordConfirmLabel,
            passwordMismatchAlert: m.signup.passwordMismatchAlert,
            createAccount: m.signup.createAccount,
            consentPreamble: m.signup.consentPreamble,
            consentBetween: m.auth.consentBetween,
            consentConclude: m.auth.consentConclude,
            ageCheckbox: m.auth.ageCheckbox,
            consentRequiredAlert: m.auth.consentRequiredAlert,
            signupNotReadyAlert: m.signup.signupNotReadyAlert,
          }}
        />
      )}
    </div>
  );
}
