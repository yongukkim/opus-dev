import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/types";
import { withLocale } from "@/i18n/paths";

export function VaultAuthGate({
  locale,
  m,
  returnTo,
  developmentPreview,
}: {
  locale: Locale;
  m: Messages;
  returnTo: string;
  /** Local dev only: secondary link to open the same returnTo with ?preview=1 (parent page must honor it). */
  developmentPreview?: { href: string; label: string };
}) {
  const s = m.accountSettings;
  const loginHref = `${withLocale(locale, "/login")}?returnTo=${encodeURIComponent(returnTo)}`;
  const signupHref = `${withLocale(locale, "/signup")}?returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <main className="p-6 md:p-10">
      <p className="opus-text-metallic-soft font-mono text-[0.65rem] uppercase tracking-[0.28em]">Vault</p>
      <h1 className="mt-3 font-display text-2xl text-opus-warm md:text-3xl">{s.authGateTitle}</h1>
      <p className="mt-4 max-w-2xl font-sans text-sm leading-relaxed text-opus-warm/55">{s.authGateBody}</p>
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <Link
          href={loginHref}
          className="opus-surface-metallic inline-flex w-fit items-center justify-center rounded-full px-8 py-3 text-sm font-medium text-black transition hover:opacity-95"
        >
          {m.auth.signIn}
        </Link>
        <Link
          href={signupHref}
          className="text-sm text-opus-gold/70 underline-offset-4 transition hover:text-opus-gold hover:underline"
        >
          {m.signup.title}
        </Link>
      </div>
      {process.env.NODE_ENV !== "production" && developmentPreview ? (
        <p className="mt-10 max-w-xl text-xs leading-relaxed text-opus-warm/40">
          <Link
            href={developmentPreview.href}
            className="text-opus-gold/80 underline-offset-4 hover:text-opus-gold-light hover:underline"
          >
            {developmentPreview.label}
          </Link>
        </p>
      ) : null}
    </main>
  );
}

