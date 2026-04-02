"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthConsentBlock } from "@/components/auth/AuthConsentBlock";

function Field({
  label,
  type,
  value,
  onChange,
  hasError,
  autoComplete,
}: {
  label: string;
  type: "text" | "email" | "password";
  value: string;
  onChange: (v: string) => void;
  hasError?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="block font-mono text-[0.65rem] uppercase tracking-[0.22em] text-opus-warm/45">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete ?? "off"}
        className={`mt-2 w-full rounded-xl border bg-black/25 px-4 py-3 text-sm text-opus-warm/85 outline-none transition placeholder:text-opus-warm/30 focus:ring-2 ${
          hasError
            ? "border-red-400/40 focus:border-red-400/55 focus:ring-red-400/15"
            : "border-white/[0.12] focus:border-opus-gold/45 focus:ring-opus-gold/20"
        }`}
        placeholder=""
      />
    </label>
  );
}

export function SignupPanel({
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
    displayNameLabel: string;
    emailLabel: string;
    passwordLabel: string;
    passwordConfirmLabel: string;
    passwordMismatchAlert: string;
    createAccount: string;
    consentPreamble: string;
    consentBetween: string;
    consentConclude: string;
    ageCheckbox: string;
    consentRequiredAlert: string;
    signupNotReadyAlert: string;
  };
}) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [showPasswordMismatch, setShowPasswordMismatch] = useState(false);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  const inactive = !ageConfirmed;
  const passwordMismatch =
    password.length > 0 && passwordConfirm.length > 0 && password !== passwordConfirm;

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

      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!ageConfirmed) {
            window.alert(strings.consentRequiredAlert);
            return;
          }
          /**
           * ISO 27001 A.14.2.1 (§1) Input validation
           * KO: 비밀번호 확인 일치 여부를 제출 시 검증합니다.
           * JA: 送信時にパスワード確認の一致を検証します。
           * EN: Validates password confirmation match on submit.
           */
          if (password !== passwordConfirm) {
            setShowPasswordMismatch(true);
            window.alert(strings.passwordMismatchAlert);
            return;
          }
          setShowPasswordMismatch(false);
          if (pending) return;
          setPending(true);
          try {
            const res = await fetch("/api/auth/demo-session", { method: "POST" });
            if (!res.ok) {
              window.alert(strings.signupNotReadyAlert);
              return;
            }
            router.push(returnTo);
            router.refresh();
          } catch {
            window.alert(strings.signupNotReadyAlert);
          } finally {
            setPending(false);
          }
        }}
      >
        <Field
          label={strings.displayNameLabel}
          type="text"
          value={displayName}
          onChange={setDisplayName}
          autoComplete="name"
        />
        <Field
          label={strings.emailLabel}
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
        />
        <Field
          label={strings.passwordLabel}
          type="password"
          value={password}
          onChange={(v) => {
            setPassword(v);
            setShowPasswordMismatch(false);
          }}
          autoComplete="new-password"
        />
        <div>
          <Field
            label={strings.passwordConfirmLabel}
            type="password"
            value={passwordConfirm}
            onChange={(v) => {
              setPasswordConfirm(v);
              setShowPasswordMismatch(false);
            }}
            hasError={showPasswordMismatch || passwordMismatch}
            autoComplete="new-password"
          />
          {passwordMismatch ? (
            <p className="mt-2 text-xs text-red-300/75" role="alert">
              {strings.passwordMismatchAlert}
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          aria-disabled={inactive}
          className={`opus-surface-metallic relative mt-2 inline-flex w-full items-center justify-center overflow-hidden rounded-xl px-5 py-3 text-sm font-semibold tracking-[0.12em] text-black transition ${
            inactive ? "cursor-not-allowed opacity-45" : "hover:opacity-95"
          }`}
        >
          <span className="relative z-[1]">{strings.createAccount}</span>
        </button>
      </form>
    </div>
  );
}
