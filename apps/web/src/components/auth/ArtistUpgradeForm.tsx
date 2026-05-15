"use client";

/**
 * ISO 27001 A.9.2.1 / A.18.1.4 (CLAUDE.md §4, §7)
 * KO: 이미 로그인된 일반 회원이 작가 등록 시 약관 동의 후 서버 액션으로 ARTIST 역할을 부여한다.
 * JA: ログイン済みの一般会員が作家登録する際、同意後にサーバーアクションでARTISTロールを付与する。
 * EN: Logged-in collectors can upgrade to ARTIST by agreeing to terms and submitting a server action.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthConsentBlock } from "@/components/auth/AuthConsentBlock";
import { FormMessageModal } from "@/components/forms/FormMessageModal";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/types";

export function ArtistUpgradeForm({
  locale,
  returnTo,
  userId,
  termsHref,
  privacyHref,
  termsLabel,
  privacyLabel,
  m,
}: {
  locale: Locale;
  returnTo: string;
  userId: string;
  termsHref: string;
  privacyHref: string;
  termsLabel: string;
  privacyLabel: string;
  m: Messages;
}) {
  const router = useRouter();
  const [termsPrivacy, setTermsPrivacy] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consentModalOpen, setConsentModalOpen] = useState(false);

  const consentSatisfied = termsPrivacy && ageConfirmed;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consentSatisfied) {
      setConsentModalOpen(true);
      return;
    }
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/artist-upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketing }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? m.auth.consentPrecheckFailedAlert);
        return;
      }
      router.push(returnTo);
    } catch {
      setError(m.auth.consentPrecheckFailedAlert);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 space-y-5">
      {error ? (
        <p className="rounded-xl border border-red-500/25 bg-red-950/30 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}
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
      <button
        type="submit"
        disabled={!consentSatisfied || pending}
        className="opus-surface-metallic inline-flex w-full items-center justify-center rounded-xl px-6 py-3.5 text-sm font-semibold text-opus-charcoal shadow-lg disabled:opacity-40"
      >
        {pending ? "…" : "작가 등록 완료"}
      </button>

      <FormMessageModal
        open={consentModalOpen}
        title={m.formUi.validationTitle}
        message={m.auth.consentRequiredAlert}
        confirmLabel={m.formUi.confirm}
        variant="neutral"
        onClose={() => setConsentModalOpen(false)}
      />
    </form>
  );
}
