"use client";

import { useActionState, useState, type FormEvent } from "react";
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
}: {
  locale: Locale;
  t: ConsoleMessages;
  queryBanner?: { message: string; variant: "info" | "success" | "error" };
}) {
  const [state, formAction, pending] = useActionState<ConsoleLoginState | undefined, FormData>(
    consoleLoginAction,
    undefined,
  );

  return (
    <div className="mt-6 space-y-4">
      {queryBanner ? <Banner message={queryBanner.message} variant={queryBanner.variant} /> : null}
      {state?.error ? <Banner message={state.error} variant="error" /> : null}
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
