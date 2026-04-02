import { getDictionary } from "@/i18n/catalog";
import { normalizeLocale, withLocale } from "@/i18n/paths";
import { sanitizeReturnTo } from "@/lib/returnTo";
import Link from "next/link";
import { SignupPanel } from "@/components/auth/SignupPanel";

type Props = { params: Promise<{ locale: string }> };

export default async function ArtistSignupPage({
  params,
  searchParams,
}: Props & { searchParams: Promise<{ returnTo?: string }> }) {
  const { locale: raw } = await params;
  const { returnTo: returnToParam } = await searchParams;
  const locale = normalizeLocale(raw);
  const m = getDictionary(locale);
  const s = m.artistSignup ?? m.signup;
  const returnTo = sanitizeReturnTo(returnToParam, withLocale(locale, "/artist/kyc/consent"));
  const loginHref = `${withLocale(locale, "/login")}?returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <main className="min-h-screen bg-opus-charcoal px-6 pb-24 pt-[calc(6.5rem+4rem)] text-opus-warm/80">
      <div className="mx-auto max-w-md">
        <p className="opus-text-metallic-soft text-center text-xs uppercase tracking-[0.4em]">OPUS</p>
        <h1 className="mt-4 text-center font-display text-3xl tracking-[0.12em] text-opus-warm">
          {s.title}
        </h1>
        <p className="mt-3 text-center text-sm text-opus-warm/55">{s.subtitle}</p>

        <SignupPanel
          termsHref={withLocale(locale, "/terms")}
          privacyHref={withLocale(locale, "/privacy")}
          termsLabel={m.footer.terms}
          privacyLabel={m.footer.privacy}
          returnTo={returnTo}
          strings={{
            displayNameLabel: s.displayNameLabel,
            emailLabel: s.emailLabel,
            passwordLabel: s.passwordLabel,
            passwordConfirmLabel: s.passwordConfirmLabel,
            passwordMismatchAlert: s.passwordMismatchAlert,
            createAccount: s.createAccount,
            consentPreamble: s.consentPreamble,
            consentBetween: m.auth.consentBetween,
            consentConclude: m.auth.consentConclude,
            ageCheckbox: m.auth.ageCheckbox,
            consentRequiredAlert: m.auth.consentRequiredAlert,
            signupNotReadyAlert: s.signupNotReadyAlert,
          }}
        />

        <p className="mt-6 rounded-xl border border-opus-gold/15 bg-opus-slate/30 px-5 py-4 text-xs leading-relaxed text-opus-warm/55">
          {s.note}
        </p>

        <div className="mt-10 text-center text-sm text-opus-warm/55">
          <span>{s.alreadyHaveAccount}</span>{" "}
          <Link
            href={loginHref}
            className="text-opus-gold underline-offset-4 hover:text-opus-gold-light hover:underline"
          >
            {s.signInLink}
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
