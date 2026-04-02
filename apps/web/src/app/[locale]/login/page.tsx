import { getDictionary } from "@/i18n/catalog";
import { normalizeLocale, withLocale } from "@/i18n/paths";
import { sanitizeReturnTo } from "@/lib/returnTo";
import Link from "next/link";
import { LoginPanel } from "@/components/auth/LoginPanel";

type Props = { params: Promise<{ locale: string }> };

export default async function LoginPage({
  params,
  searchParams,
}: Props & { searchParams: Promise<{ returnTo?: string }> }) {
  const { locale: raw } = await params;
  const { returnTo: returnToParam } = await searchParams;
  const locale = normalizeLocale(raw);
  const m = getDictionary(locale);
  const returnTo = sanitizeReturnTo(returnToParam, withLocale(locale, "/vault"));
  const signupHref = `${withLocale(locale, "/signup")}?returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <main className="min-h-screen bg-opus-charcoal px-6 pb-24 pt-[calc(6.5rem+4rem)] text-opus-warm/80">
      <div className="mx-auto max-w-md">
        <p className="opus-text-metallic-soft text-center text-xs uppercase tracking-[0.4em]">OPUS</p>
        <h1 className="mt-4 text-center font-display text-3xl tracking-[0.12em] text-opus-warm">
          {m.auth.title}
        </h1>
        <p className="mt-3 text-center text-sm text-opus-warm/55">{m.auth.subtitle}</p>

        <LoginPanel
          termsHref={withLocale(locale, "/terms")}
          privacyHref={withLocale(locale, "/privacy")}
          termsLabel={m.footer.terms}
          privacyLabel={m.footer.privacy}
          returnTo={returnTo}
          strings={{
            continueWithApple: m.auth.continueWithApple,
            continueWithGoogle: m.auth.continueWithGoogle,
            continueWithLine: m.auth.continueWithLine,
            hint: m.auth.hintSoon,
            consentPreamble: m.auth.consentPreamble,
            consentBetween: m.auth.consentBetween,
            consentConclude: m.auth.consentConclude,
            ageCheckbox: m.auth.ageCheckbox,
            consentRequiredAlert: m.auth.consentRequiredAlert,
            ssoNotReadyAlert: m.auth.ssoNotReadyAlert,
          }}
        />

        <p className="mt-6 rounded-xl border border-opus-gold/15 bg-opus-slate/30 px-5 py-4 text-xs leading-relaxed text-opus-warm/55">
          {m.auth.note}
        </p>

        <div className="mt-10 text-center text-sm text-opus-warm/55">
          <Link
            href={signupHref}
            className="text-opus-gold underline-offset-4 hover:text-opus-gold-light hover:underline"
          >
            {m.signup.title}
          </Link>
        </div>

        <div className="mt-10 text-center">
          <Link
            href={withLocale(locale, "/")}
            className="text-sm text-opus-gold underline-offset-4 hover:text-opus-gold-light hover:underline"
          >
            ← Home
          </Link>
        </div>
      </div>
    </main>
  );
}

