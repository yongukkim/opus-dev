"use client";

import { useActionState, useState, type FormEvent } from "react";
import type { Locale } from "@/i18n/config";
import type { ConsoleMessages } from "@/i18n/types";
import { consoleLoginAction, type ConsoleLoginState } from "./actions";

function Banner({ message, variant }: { message: string; variant: "info" | "success" | "error" }) {
  const cls =
    variant === "success"
      ? "bg-emerald-50 text-emerald-900"
      : variant === "error"
        ? "bg-red-50 text-red-900"
        : "bg-sky-50 text-sky-900";
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
          <label htmlFor="email" className="block text-xs font-medium text-gray-700">
            {t.login.email}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-xs font-medium text-gray-700">
            {t.login.password}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50 disabled:opacity-60"
        >
          {pending ? t.login.submitting : t.login.submit}
        </button>
      </form>
      <p className="text-center text-sm text-gray-600">
        {t.login.registerPrompt}{" "}
        <span className="text-gray-500">{t.login.invitationNote}</span>
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
    <details className="text-xs text-gray-500">
      <summary className="cursor-pointer select-none text-gray-600 hover:text-gray-800">{t.login.resend.summary}</summary>
      <form className="mt-2 space-y-2" onSubmit={onSubmit}>
        <p className="text-gray-500">{t.login.resend.details}</p>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
          placeholder={t.login.resend.emailPlaceholder}
          className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-60"
        >
          {status === "sending" ? t.login.resend.sending : t.login.resend.send}
        </button>
        {status === "done" ? <p className="text-emerald-700">{t.login.resend.sent}</p> : null}
        {status === "error" ? <p className="text-red-700">{t.login.resend.failed}</p> : null}
      </form>
    </details>
  );
}
