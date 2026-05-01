"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export function ConsoleOtpLogin({ googleOAuthConfigured }: { googleOAuthConfigured: boolean }) {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const res = await fetch("/api/console/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (res.status === 429) {
        setError("Too many requests. Try again in about an hour.");
        return;
      }
      if (res.status === 503) {
        setError("Email delivery is not configured. Set RESEND_API_KEY on the server.");
        return;
      }
      if (!res.ok) {
        setError("Could not send a code. Check the address and try again.");
        return;
      }
      setStep("code");
      setMessage("If this address is authorized for the console, a 6-digit code was sent. It expires in 10 minutes.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const r = await signIn("console-otp", {
        email: email.trim(),
        code: code.trim(),
        callbackUrl: "/review",
        redirect: false,
      });
      if (r?.error) {
        setError("Invalid or expired code.");
        return;
      }
      if (r?.ok && r.url) {
        window.location.href = r.url;
        return;
      }
      window.location.href = "/review";
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 space-y-4">
      {step === "email" ? (
        <form onSubmit={requestCode} className="space-y-3">
          <div>
            <label htmlFor="console-email" className="block text-sm font-medium text-gray-700">
              Work email
            </label>
            <input
              id="console-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="you@company.com"
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="inline-flex w-full items-center justify-center rounded-md bg-gray-900 px-4 py-2.5 text-sm font-medium text-white shadow hover:bg-gray-800 disabled:opacity-60"
          >
            {busy ? "Sending…" : "Send sign-in code"}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="space-y-3">
          {message ? <p className="text-sm text-gray-600">{message}</p> : null}
          <div>
            <label htmlFor="console-code" className="block text-sm font-medium text-gray-700">
              6-digit code
            </label>
            <input
              id="console-code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              required
              value={code}
              onChange={(ev) => setCode(ev.target.value.replace(/\D/g, "").slice(0, 6))}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm tracking-widest shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="000000"
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={busy || code.length !== 6}
            className="inline-flex w-full items-center justify-center rounded-md bg-gray-900 px-4 py-2.5 text-sm font-medium text-white shadow hover:bg-gray-800 disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setCode("");
              setMessage(null);
              setError(null);
            }}
            className="w-full text-center text-sm font-medium text-gray-600 underline decoration-gray-400 underline-offset-2 hover:text-gray-900"
          >
            Use a different email
          </button>
        </form>
      )}

      {googleOAuthConfigured ? (
        <div className="relative pt-4">
          <div className="absolute inset-x-0 top-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-wide">
            <span className="bg-white px-2 text-gray-400">Or</span>
          </div>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- full navigation required for OAuth 302 */}
          <a
            href="/api/auth/signin/google"
            className="mt-4 inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50"
          >
            Continue with Google
          </a>
        </div>
      ) : null}
    </div>
  );
}
