"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * ISO 27001 A.14.2.1 (§1) Input validation
 * KO: 이메일·비밀번호는 신뢰할 수 없는 입력으로 간주하고, 제출 전 길이·형식을 최소한으로 검증합니다(실제 인증은 서버에서 수행).
 * JA: メール・パスワードは信頼できない入力として扱い、送信前に長さ・形式を最低限検証します（実際の認証はサーバー側）。
 * EN: Treat email/password as untrusted; validate minimal length/format before submit (real auth happens server-side).
 */
export function EmailLoginPanel({
  returnTo,
  sharedConsent,
  strings,
}: {
  returnTo: string;
  sharedConsent: { ageConfirmed: boolean };
  strings: {
    emailLabel: string;
    passwordLabel: string;
    signIn: string;
    consentRequiredAlert: string;
    sessionNotReadyAlert: string;
  };
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  const { ageConfirmed } = sharedConsent;
  const inactive = !ageConfirmed;

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!ageConfirmed) {
          window.alert(strings.consentRequiredAlert);
          return;
        }
        const form = e.currentTarget;
        if (!form.reportValidity()) return;
        if (pending) return;
        setPending(true);
        try {
          const res = await fetch("/api/auth/demo-session", { method: "POST" });
          if (!res.ok) {
            window.alert(strings.sessionNotReadyAlert);
            return;
          }
          router.push(returnTo);
          router.refresh();
        } catch {
          window.alert(strings.sessionNotReadyAlert);
        } finally {
          setPending(false);
        }
      }}
    >
      <label className="block">
        <span className="block font-mono text-[0.65rem] uppercase tracking-[0.22em] text-opus-warm/45">
          {strings.emailLabel}
        </span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-2 w-full rounded-xl border border-white/[0.12] bg-black/25 px-4 py-3 text-sm text-opus-warm/85 outline-none transition focus:border-opus-gold/45 focus:ring-2 focus:ring-opus-gold/20"
        />
      </label>
      <label className="block">
        <span className="block font-mono text-[0.65rem] uppercase tracking-[0.22em] text-opus-warm/45">
          {strings.passwordLabel}
        </span>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-2 w-full rounded-xl border border-white/[0.12] bg-black/25 px-4 py-3 text-sm text-opus-warm/85 outline-none transition focus:border-opus-gold/45 focus:ring-2 focus:ring-opus-gold/20"
        />
      </label>

      <button
        type="submit"
        disabled={inactive || pending}
        className={`opus-surface-metallic relative mt-2 inline-flex w-full items-center justify-center overflow-hidden rounded-xl px-5 py-3 text-sm font-semibold tracking-[0.12em] text-black transition ${
          inactive || pending ? "cursor-not-allowed opacity-45" : "hover:opacity-95"
        }`}
      >
        <span className="relative z-[1]">{strings.signIn}</span>
      </button>
    </form>
  );
}
