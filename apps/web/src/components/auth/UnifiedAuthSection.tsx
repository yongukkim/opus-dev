"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { AuthConsentBlock } from "@/components/auth/AuthConsentBlock";
import { SsoProviderButtons } from "@/components/auth/SsoProviderButtons";
import { FormMessageModal } from "@/components/forms/FormMessageModal";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/types";
import type { OAuthConsentFlow } from "@/lib/oauthConsentCookie";
import type { StorefrontSsoConfigured } from "@/lib/storefrontSso";

type ResendState = "idle" | "sending" | "done" | "error";

/**
 * OAuth (Google / Apple / LINE) with APPI consent gates + email/password.
 *
 * variant="signup" | "artist-signup":
 *   Mandatory consent checkboxes (ToS + Privacy, 18+). Optional marketing.
 *   POST consent to /api/auth/oauth-precheck before SNS redirect.
 *   Email path: POST /api/auth/register (sends inbox verification; no session until link opened).
 *
 * variant="login":
 *   No consent UI. Credentials require a verified email (`User.emailVerified`).
 *
 * ISO 27001 A.18.1.4 (§7 APPI / PIPA §28-8 ②항)
 * KO: 이용약관·개인정보처리방침 동의에 선택한 SNS의 국외이전 고지가 포함되므로
 *     precheck 쿠키에 overseasAccepted=true 를 함께 기록한다.
 * JA: 利用規約・プライバシーポリシーへの同意に、選択したSNSの国外移転の告知を含めるため、
 *     precheck クッキーにも overseasAccepted=true を記録する。
 * EN: Terms + Privacy consent covers the selected SNS cross-border disclosure; precheck records overseasAccepted=true.
 */
export function UnifiedAuthSection({
  variant,
  locale,
  returnTo,
  sso,
  termsHref,
  privacyHref,
  termsLabel,
  privacyLabel,
  m,
}: {
  variant: OAuthConsentFlow;
  locale: Locale;
  returnTo: string;
  sso: StorefrontSsoConfigured;
  termsHref: string;
  privacyHref: string;
  termsLabel: string;
  privacyLabel: string;
  m: Messages;
}) {
  const isLogin = variant === "login";
  const signupCopy = variant === "artist-signup" ? m.artistSignup : m.signup;

  const [termsPrivacy, setTermsPrivacy] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [pendingOAuth, setPendingOAuth] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [pendingCredentials, setPendingCredentials] = useState(false);
  const [resendState, setResendState] = useState<ResendState>("idle");
  const [dialog, setDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    variant: "neutral" | "error";
  }>({ open: false, title: "", message: "", variant: "neutral" });

  function openFormDialog(
    message: string,
    kind: "validation" | "notice",
    variant: "neutral" | "error" = "neutral",
  ) {
    const title = kind === "validation" ? m.formUi.validationTitle : m.formUi.errorTitle;
    setDialog({ open: true, title, message, variant });
  }

  const consentSatisfied = isLogin ? true : termsPrivacy && ageConfirmed;
  const ssoBlocked = !consentSatisfied || pendingOAuth;

  const googleInactive = !sso.google || ssoBlocked;
  const appleInactive = !sso.apple || ssoBlocked;
  const lineInactive = !sso.line || ssoBlocked;

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

  function providerNotConfiguredMessage(brand: string): string {
    return m.auth.providerNotConfigured.replace("{name}", brand);
  }

  async function handleOAuth(providerId: "google" | "apple" | "line", configured: boolean, brand: string) {
    if (!configured) {
      openFormDialog(providerNotConfiguredMessage(brand), "notice", "error");
      return;
    }
    if (!consentSatisfied) {
      openFormDialog(m.auth.consentRequiredAlert, "validation");
      return;
    }
    if (pendingOAuth) return;
    setPendingOAuth(true);
    try {
      if (!isLogin) {
        const ok = await runPrecheck();
        if (!ok) {
          openFormDialog(m.auth.consentPrecheckFailedAlert, "notice", "error");
          return;
        }
      }
      await signIn(providerId, { callbackUrl: returnTo });
    } catch {
      openFormDialog(m.auth.consentPrecheckFailedAlert, "notice", "error");
    } finally {
      setPendingOAuth(false);
    }
  }

  async function handleCredentialsLogin() {
    if (!email.trim() || !password) {
      openFormDialog(m.auth.loginInvalidCredentialsAlert, "validation");
      return;
    }
    if (pendingCredentials) return;
    setPendingCredentials(true);
    try {
      const res = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
        callbackUrl: returnTo,
      });
      if (res?.error) {
        openFormDialog(m.auth.loginInvalidCredentialsAlert, "notice", "error");
        return;
      }
      if (res?.ok && res.url) {
        window.location.assign(res.url);
      }
    } catch {
      openFormDialog(m.auth.loginInvalidCredentialsAlert, "notice", "error");
    } finally {
      setPendingCredentials(false);
    }
  }

  async function handleResendVerification() {
    const to = email.trim();
    if (!to) return;
    setResendState("sending");
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: to, locale }),
      });
      if (!res.ok) {
        setResendState("error");
        return;
      }
      setResendState("done");
    } catch {
      setResendState("error");
    }
  }

  function mapRegisterError(err: string | undefined): string {
    switch (err) {
      case "email_taken":
        return signupCopy.registerEmailTaken;
      case "oauth_email_exists":
        return signupCopy.registerOAuthEmailExists;
      case "password_weak":
        return signupCopy.registerPasswordWeak;
      case "email_invalid":
        return signupCopy.registerEmailInvalid;
      case "consent_required":
        return signupCopy.registerConsentRequired;
      case "password_mismatch":
        return signupCopy.passwordMismatchAlert;
      case "verification_send_failed":
        return signupCopy.registerVerificationSendFailed;
      case "mail_not_configured":
        return signupCopy.registerMailNotConfigured;
      default:
        return signupCopy.registerFailedAlert;
    }
  }

  async function handleEmailSignup() {
    if (!consentSatisfied) {
      openFormDialog(m.auth.consentRequiredAlert, "validation");
      return;
    }
    if (password !== passwordConfirm) {
      openFormDialog(signupCopy.passwordMismatchAlert, "validation");
      return;
    }
    if (pendingCredentials) return;
    setPendingCredentials(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flow: variant,
          locale,
          email: email.trim(),
          password,
          passwordConfirm,
          displayName: displayName.trim(),
          termsAccepted: true,
          privacyAccepted: true,
          overseasAccepted: true,
          adultAccepted: true,
          marketingAccepted: marketing,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        emailVerification?: "sent" | "dev_logged";
      };
      if (!res.ok || !data.ok) {
        openFormDialog(mapRegisterError(data.error), "notice", "error");
        return;
      }
      let msg = `${signupCopy.registerVerificationSent}\n\n${signupCopy.registerVerificationCheckSpam}`;
      if (data.emailVerification === "dev_logged") {
        msg += `\n\n${signupCopy.registerVerificationDevHint}`;
      }
      openFormDialog(msg, "notice");
      setPassword("");
      setPasswordConfirm("");
    } catch {
      openFormDialog(signupCopy.registerFailedAlert, "notice", "error");
    } finally {
      setPendingCredentials(false);
    }
  }

  const credentialsSignupBlocked = !consentSatisfied || pendingCredentials;

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
        googleInactive={googleInactive}
        appleInactive={appleInactive}
        lineInactive={lineInactive}
        onGoogleClick={() => void handleOAuth("google", sso.google, "Google")}
        onAppleClick={() => void handleOAuth("apple", sso.apple, "Apple")}
        onLineClick={() => void handleOAuth("line", sso.line, "LINE")}
      />

      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-white/[0.08]" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-opus-charcoal px-3 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-opus-warm/45">
            {m.auth.emailDividerLabel}
          </span>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-white/[0.08] bg-opus-slate/20 p-5">
        <label className="block">
          <span className="mb-1 block text-[0.7rem] uppercase tracking-[0.18em] text-opus-warm/45">
            {m.auth.emailLabel}
          </span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-white/[0.12] bg-opus-charcoal/80 px-3 py-2.5 text-sm text-opus-warm outline-none ring-opus-gold/30 placeholder:text-opus-warm/35 focus:ring-2"
          />
        </label>
        {!isLogin && (
          <p className="text-xs leading-relaxed text-opus-warm/50">{signupCopy.emailRecoverabilityHint}</p>
        )}
        <label className="block">
          <span className="mb-1 block text-[0.7rem] uppercase tracking-[0.18em] text-opus-warm/45">
            {m.auth.passwordLabel}
          </span>
          <input
            type="password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-white/[0.12] bg-opus-charcoal/80 px-3 py-2.5 text-sm text-opus-warm outline-none ring-opus-gold/30 placeholder:text-opus-warm/35 focus:ring-2"
          />
        </label>

        {!isLogin && (
          <>
            <label className="block">
              <span className="mb-1 block text-[0.7rem] uppercase tracking-[0.18em] text-opus-warm/45">
                {signupCopy.passwordConfirmLabel}
              </span>
              <input
                type="password"
                autoComplete="new-password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                disabled={credentialsSignupBlocked}
                className="w-full rounded-lg border border-white/[0.12] bg-opus-charcoal/80 px-3 py-2.5 text-sm text-opus-warm outline-none ring-opus-gold/30 placeholder:text-opus-warm/35 focus:ring-2 disabled:opacity-45"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[0.7rem] uppercase tracking-[0.18em] text-opus-warm/45">
                {signupCopy.displayNameLabel}
              </span>
              <input
                type="text"
                autoComplete="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={credentialsSignupBlocked}
                className="w-full rounded-lg border border-white/[0.12] bg-opus-charcoal/80 px-3 py-2.5 text-sm text-opus-warm outline-none ring-opus-gold/30 placeholder:text-opus-warm/35 focus:ring-2 disabled:opacity-45"
              />
            </label>
          </>
        )}

        {isLogin ? (
          <button
            type="button"
            disabled={pendingCredentials || !email.trim() || !password}
            onClick={() => void handleCredentialsLogin()}
            className="opus-surface-metallic flex w-full items-center justify-center rounded-xl px-4 py-3.5 text-sm font-medium text-opus-charcoal transition disabled:cursor-not-allowed disabled:opacity-45"
          >
            {pendingCredentials ? m.auth.signingIn : m.auth.signInWithEmail}
          </button>
        ) : (
          <button
            type="button"
            disabled={credentialsSignupBlocked}
            onClick={() => void handleEmailSignup()}
            className="opus-surface-metallic flex w-full items-center justify-center rounded-xl px-4 py-3.5 text-sm font-medium text-opus-charcoal transition disabled:cursor-not-allowed disabled:opacity-45"
          >
            {pendingCredentials ? signupCopy.registering : signupCopy.createAccount}
          </button>
        )}

        {isLogin && (
          <div className="border-t border-white/[0.06] pt-4">
            <p className="text-xs text-opus-warm/50">{m.auth.resendVerificationSummary}</p>
            <button
              type="button"
              disabled={!email.trim() || resendState === "sending"}
              onClick={() => void handleResendVerification()}
              className="mt-2 w-full rounded-lg border border-white/[0.12] bg-white/[0.04] px-3 py-2 text-xs text-opus-warm/80 transition hover:border-opus-gold/35 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {resendState === "sending" ? m.auth.resendVerificationSending : m.auth.resendVerificationSubmit}
            </button>
            {resendState === "done" ? (
              <p className="mt-2 text-xs text-emerald-400/90">{m.auth.resendVerificationDone}</p>
            ) : null}
            {resendState === "error" ? (
              <p className="mt-2 text-xs text-red-400/90">{m.auth.resendVerificationFailed}</p>
            ) : null}
          </div>
        )}
      </div>

      <FormMessageModal
        open={dialog.open}
        title={dialog.title}
        message={dialog.message}
        confirmLabel={m.formUi.confirm}
        variant={dialog.variant}
        onClose={() => setDialog((d) => ({ ...d, open: false }))}
      />
    </div>
  );
}
