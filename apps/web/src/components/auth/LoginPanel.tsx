"use client";

import { useState } from "react";
import { AuthConsentBlock } from "@/components/auth/AuthConsentBlock";

function IconApple() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
      <path
        fill="currentColor"
        d="M16.7 12.9c0-2.2 1.8-3.3 1.9-3.4-1-1.5-2.6-1.7-3.1-1.7-1.3-.1-2.5.8-3.2.8-.7 0-1.7-.8-2.8-.8-1.4 0-2.8.8-3.5 2.1-1.5 2.6-.4 6.4 1.1 8.5.7 1 1.6 2.2 2.8 2.1 1.1 0 1.5-.7 2.9-.7 1.4 0 1.8.7 3 .7 1.2 0 2-.9 2.7-1.9.8-1.1 1.1-2.2 1.1-2.3-.1 0-2.8-1.1-2.9-4.4ZM14.6 6.2c.6-.8 1-1.9.9-3-.9.1-2 .6-2.6 1.4-.6.7-1.1 1.8-.9 2.9 1 .1 2-.5 2.6-1.3Z"
      />
    </svg>
  );
}

function IconGoogle() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
      <path
        fill="currentColor"
        d="M12 5.2c1.7 0 3.1.6 4.2 1.6l1.9-1.9C16.6 3.5 14.5 2.6 12 2.6 8 2.6 4.5 4.9 3 8.3l2.2 1.7C6.2 7.1 8.9 5.2 12 5.2Zm9.3 6.8c0-.7-.1-1.3-.2-1.9H12v3.6h5.3c-.2 1.2-.9 2.2-1.9 2.9l2.2 1.7c2-1.8 3.4-4.5 3.4-7.3ZM12 21.4c2.5 0 4.6-.8 6.1-2.3l-2.2-1.7c-.9.6-2.1 1-3.9 1-3 0-5.6-2-6.5-4.7l-2.3 1.8c1.5 3.3 5 5.5 8.8 5.5Zm-6.5-7.1c-.2-.6-.4-1.3-.4-2s.1-1.4.4-2L3.2 8.6c-.6 1.1-.9 2.4-.9 3.7s.3 2.6.9 3.7l2.3-1.7Z"
      />
    </svg>
  );
}

function IconLine() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
      <path
        fill="currentColor"
        d="M12 3C6.9 3 3 6.3 3 10.5c0 2.4 1.4 4.6 3.6 6.1-.1.7-.5 2.4-.5 2.7 0 0-.1.2.1.3.2.1.3 0 .3 0 .4-.1 2.4-1.6 3.2-2.1.7.2 1.5.3 2.4.3 5.1 0 9-3.3 9-7.5S17.1 3 12 3Zm-3.4 7.9h6.8c.3 0 .6.3.6.6s-.3.6-.6.6H8.6c-.3 0-.6-.3-.6-.6s.3-.6.6-.6Zm0-2.3h6.8c.3 0 .6.3.6.6s-.3.6-.6.6H8.6c-.3 0-.6-.3-.6-.6s.3-.6.6-.6Zm0 4.6h4.4c.3 0 .6.3.6.6s-.3.6-.6.6H8.6c-.3 0-.6-.3-.6-.6s.3-.6.6-.6Z"
      />
    </svg>
  );
}

function ProviderButton({
  icon,
  label,
  hint,
  inactive,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  inactive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-disabled={inactive}
      className={`flex w-full items-center justify-between rounded-xl border px-5 py-4 text-left transition ${
        inactive
          ? "cursor-not-allowed border-white/[0.08] bg-white/[0.02] opacity-45"
          : "border-white/[0.12] bg-white/[0.04] hover:border-opus-gold/35 hover:bg-white/[0.06]"
      }`}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="text-opus-warm/80">{icon}</span>
        <span className="truncate font-sans text-sm text-opus-warm/85">{label}</span>
      </span>
      <span className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-opus-warm/45">{hint}</span>
    </button>
  );
}

export function LoginPanel({
  termsHref,
  privacyHref,
  termsLabel,
  privacyLabel,
  strings,
}: {
  termsHref: string;
  privacyHref: string;
  termsLabel: string;
  privacyLabel: string;
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

  function handleSsoClick() {
    if (!ageConfirmed) {
      window.alert(strings.consentRequiredAlert);
      return;
    }
    window.alert(strings.ssoNotReadyAlert);
  }

  const ssoInactive = !ageConfirmed;

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

      <div className="space-y-3">
        <ProviderButton
          icon={<IconApple />}
          label={strings.continueWithApple}
          hint={strings.hint}
          inactive={ssoInactive}
          onClick={handleSsoClick}
        />
        <ProviderButton
          icon={<IconGoogle />}
          label={strings.continueWithGoogle}
          hint={strings.hint}
          inactive={ssoInactive}
          onClick={handleSsoClick}
        />
        <ProviderButton
          icon={<IconLine />}
          label={strings.continueWithLine}
          hint={strings.hint}
          inactive={ssoInactive}
          onClick={handleSsoClick}
        />
      </div>
    </div>
  );
}
