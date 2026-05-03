import { getDictionary } from "@/i18n/catalog";
import { normalizeLocale, withLocale } from "@/i18n/paths";
import { sanitizeReturnTo } from "@/lib/returnTo";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UnifiedAuthSection } from "@/components/auth/UnifiedAuthSection";
import { ArtistUpgradeForm } from "@/components/auth/ArtistUpgradeForm";

type Props = { params: Promise<{ locale: string }> };

// ISO 27001 A.9.4.2 (§2) — session must be read at request time, not statically.
export const dynamic = "force-dynamic";

export default async function ArtistSignupPage({
  params,
  searchParams,
}: Props & { searchParams: Promise<{ returnTo?: string }> }) {
  const { locale: raw } = await params;
  const { returnTo: returnToParam } = await searchParams;
  const locale = normalizeLocale(raw);
  const m = getDictionary(locale);
  const s = m.artistSignup ?? m.signup;
  const returnTo = sanitizeReturnTo(returnToParam, withLocale(locale, "/artist/onboarding/profile"));
  const loginHref = `${withLocale(locale, "/login")}?role=artist&returnTo=${encodeURIComponent(returnTo)}`;
  const googleOAuthConfigured = Boolean(
    process.env["AUTH_GOOGLE_ID"]?.trim() && process.env["AUTH_GOOGLE_SECRET"]?.trim(),
  );

  // If already logged in as artist or operator, redirect to returnTo directly.
  const session = await auth();
  if (session?.user?.id) {
    const role = session.user.role;
    if (role === "artist" || role === "operator") {
      redirect(returnTo);
    }
    // Logged in as collector → show upgrade form (consent + server action).
    return (
      <main className="min-h-screen bg-opus-charcoal px-6 pb-24 pt-[calc(var(--opus-header-plus-trust)+4rem)] text-opus-warm/80">
        <div className="mx-auto max-w-md">
          <p className="opus-text-metallic-soft text-center text-xs uppercase tracking-[0.4em]">OPUS</p>
          <h1 className="mt-4 text-center font-display text-3xl tracking-[0.12em] text-opus-warm">
            {s.title}
          </h1>
          <p className="mt-3 text-center text-sm text-opus-warm/55">{s.subtitle}</p>
          <ArtistUpgradeForm
            locale={locale}
            returnTo={returnTo}
            userId={session.user.id}
            termsHref={withLocale(locale, "/terms")}
            privacyHref={withLocale(locale, "/privacy")}
            termsLabel={m.footer.terms}
            privacyLabel={m.footer.privacy}
            m={m}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-opus-charcoal px-6 pb-24 pt-[calc(var(--opus-header-plus-trust)+4rem)] text-opus-warm/80">
      <div className="mx-auto max-w-md">
        <p className="opus-text-metallic-soft text-center text-xs uppercase tracking-[0.4em]">OPUS</p>
        <h1 className="mt-4 text-center font-display text-3xl tracking-[0.12em] text-opus-warm">
          {s.title}
        </h1>
        <p className="mt-3 text-center text-sm text-opus-warm/55">{s.subtitle}</p>

        <UnifiedAuthSection
          variant="artist-signup"
          locale={locale}
          returnTo={returnTo}
          googleOAuthConfigured={googleOAuthConfigured}
          termsHref={withLocale(locale, "/terms")}
          privacyHref={withLocale(locale, "/privacy")}
          termsLabel={m.footer.terms}
          privacyLabel={m.footer.privacy}
          m={m}
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
