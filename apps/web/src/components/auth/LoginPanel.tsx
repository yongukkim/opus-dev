"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthConsentBlock } from "@/components/auth/AuthConsentBlock";
import { SsoProviderButtons } from "@/components/auth/SsoProviderButtons";

export function LoginPanel({
  termsHref,
  privacyHref,
  termsLabel,
  privacyLabel,
  returnTo,
  strings,
}: {
  termsHref: string;
  privacyHref: string;
  termsLabel: string;
  privacyLabel: string;
  returnTo: string;
  strings: {
    continueWithApple: string;
    continueWithGoogle: string;
    continueWithLine: string;
    hint: string;
    consentPreamble: string;
    consentBetween: string;
    consentConclude: string;
    ageCheckbox: string;
    consentRequiredAlert: string;
    ssoNotReadyAlert: string;
  };
}) {
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleSsoClick() {
    if (!ageConfirmed) {
      window.alert(strings.consentRequiredAlert);
      return;
    }
    if (pending) return;
    setPending(true);
    try {
      const res = await fetch("/api/auth/demo-session", { method: "POST" });
      if (!res.ok) {
        window.alert(strings.ssoNotReadyAlert);
        return;
      }
      router.push(returnTo);
      router.refresh();
    } catch {
      window.alert(strings.ssoNotReadyAlert);
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
          preamble: strings.consentPreamble,
          between: strings.consentBetween,
          conclude: strings.consentConclude,
          ageCheckbox: strings.ageCheckbox,
        }}
        checked={ageConfirmed}
        onCheckedChange={setAgeConfirmed}
      />

      <SsoProviderButtons
        strings={{
          continueWithApple: strings.continueWithApple,
          continueWithGoogle: strings.continueWithGoogle,
          continueWithLine: strings.continueWithLine,
          hint: strings.hint,
        }}
        inactive={ssoInactive}
        onSsoClick={handleSsoClick}
      />
    </div>
  );
}
