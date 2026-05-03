"use client";

import { useActionState, useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import type { Locale } from "@/i18n/config";
import type { ConsoleMessages } from "@/i18n/types";
import { consoleLoginAction, type ConsoleLoginState } from "./actions";

function Banner({ message, variant }: { message: string; variant: "info" | "success" | "error" }) {
  const cls =
    variant === "success"
      ? "border border-emerald-500/25 bg-emerald-950/40 text-emerald-100"
      : variant === "error"
        ? "border border-red-500/25 bg-red-950/40 text-red-100"
        : "border border-sky-500/20 bg-sky-950/35 text-sky-100";
  return <p className={`rounded-md px-3 py-2 text-sm ${cls}`}>{message}</p>;
}

export function ConsoleLoginForm({
  locale,
  t,
  queryBanner,
  googleConfigured,
}: {
  locale: Locale;
  t: ConsoleMessages;
  queryBanner?: { message: string; variant: "info" | "success" | "error" };
  googleConfigured?: boolean;
}) {
  const [state, formAction, pending] = useActionState<ConsoleLoginState | undefined, FormData>(
    consoleLoginAction,
    undefined,
  );

  return (
    <div className="mt-6 space-y-4">
      {queryBanner ? <Banner message={queryBanner.message} variant={queryBanner.variant} /> : null}
      {state?.error ? <Banner message={state.error} variant="error" /> : null}
      {googleConfigured ? (
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: `/${locale}/home` })}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-[#F6F4F0] shadow-sm hover:bg-white/10"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
            <path fill="currentColor" d="M12 5.2c1.7 0 3.1.6 4.2 1.6l1.9-1.9C16.6 3.5 14.5 2.6 12 2.6 8 2.6 4.5 4.9 3 8.3l2.2 1.7C6.2 7.1 8.9 5.2 12 5.2Zm9.3 6.8c0-.7-.1-1.3-.2-1.9H12v3.6h5.3c-.2 1.2-.9 2.2-1.9 2.9l2.2 1.7c2-1.8 3.4-4.5 3.4-7.3ZM12 21.4c2.5 0 4.6-.8 6.1-2.3l-2.2-1.7c-.9.6-2.1 1-3.9 1-3 0-5.6-2-6.5-4.7l-2.3 1.8c1.5 3.3 5 5.5 8.8 5.5Zm-6.5-7.1c-.2-.6-.4-1.3-.4-2s.1-1.4.4-2L3.2 8.6c-.6 1.1-.9 2.4-.9 3.7s.3 2.6.9 3.7l2.3-1.7Z" />
          </svg>
          {t.login.continueWithGoogle}
        </button>
      ) : null}
      {googleConfigured ? (
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-[#F6F4F0]/35">{t.login.orEmail}</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>
      ) : null}
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="locale" value={locale} />
        <div>
          <label htmlFor="email" className="block text-xs font-medium text-[#F6F4F0]/75">
            {t.login.email}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            className="mt-1 w-full rounded-md border border-white/15 bg-[#0E0E0E] px-3 py-2 text-sm text-[#F6F4F0] shadow-inner placeholder:text-[#F6F4F0]/35 focus:border-[#DEB892]/50 focus:outline-none focus:ring-1 focus:ring-[#DEB892]/35"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-xs font-medium text-[#F6F4F0]/75">
            {t.login.password}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="mt-1 w-full rounded-md border border-white/15 bg-[#0E0E0E] px-3 py-2 text-sm text-[#F6F4F0] shadow-inner focus:border-[#DEB892]/50 focus:outline-none focus:ring-1 focus:ring-[#DEB892]/35"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-full items-center justify-center rounded-md border border-[#DEB892]/40 bg-gradient-to-b from-[#e4c9a8] to-[#c9a574] px-4 py-2.5 text-sm font-semibold text-[#1a1510] shadow-md shadow-black/30 hover:from-[#edd4b8] hover:to-[#d1ae84] disabled:opacity-60"
        >
          {pending ? t.login.submitting : t.login.submit}
        </button>
      </form>
      <p className="text-center text-sm text-[#F6F4F0]/65">
        {t.login.registerPrompt}{" "}
        <span className="text-[#F6F4F0]/45">{t.login.invitationNote}</span>
      </p>
      <ConsoleResendVerification t={t} />
    </div>
  );
}

function ConsoleResendVerification({ t }: { t: ConsoleMessages }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/console/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <details className="text-xs text-[#F6F4F0]/50">
      <summary className="cursor-pointer select-none text-[#DEB892]/90 hover:text-[#F6F4F0]">{t.login.resend.summary}</summary>
      <form className="mt-2 space-y-2" onSubmit={onSubmit}>
        <p className="text-[#F6F4F0]/55">{t.login.resend.details}</p>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
          placeholder={t.login.resend.emailPlaceholder}
          className="w-full rounded-md border border-white/15 bg-[#0E0E0E] px-2 py-1.5 text-sm text-[#F6F4F0]"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="rounded border border-white/15 bg-white/5 px-2 py-1 text-xs font-medium text-[#F6F4F0] hover:bg-white/10 disabled:opacity-60"
        >
          {status === "sending" ? t.login.resend.sending : t.login.resend.send}
        </button>
        {status === "done" ? <p className="text-emerald-300/90">{t.login.resend.sent}</p> : null}
        {status === "error" ? <p className="text-red-300/90">{t.login.resend.failed}</p> : null}
      </form>
    </details>
  );
}
