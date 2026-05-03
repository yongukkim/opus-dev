import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ArtistOnboardingProfileForm } from "@/components/artist/ArtistOnboardingProfileForm";
import { getDictionary } from "@/i18n/catalog";
import { normalizeLocale, withLocale } from "@/i18n/paths";
import { getArtistPayoutProfile } from "@/lib/artistPayoutProfile";
import { sanitizeReturnTo } from "@/lib/returnTo";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ returnTo?: string }>;
};

export default async function ArtistOnboardingProfilePage({ params, searchParams }: Props) {
  const { locale: raw } = await params;
  const { returnTo: returnToParam } = await searchParams;
  const locale = normalizeLocale(raw);
  const m = getDictionary(locale);
  const o = m.artistOnboarding;

  const returnTo = sanitizeReturnTo(returnToParam, withLocale(locale, "/vault/submit"));
  const session = await auth();
  if (!session?.user?.id) {
    const selfHref = `${withLocale(locale, "/artist/onboarding/profile")}?returnTo=${encodeURIComponent(returnTo)}`;
    const loginHref = `${withLocale(locale, "/login")}?${new URLSearchParams({ role: "artist", returnTo: selfHref }).toString()}`;
    redirect(loginHref);
  }
  if (session.user.role !== "artist" && session.user.role !== "operator") {
    redirect(withLocale(locale, "/artist-signup"));
  }

  const payout = await getArtistPayoutProfile(session.user.id);

  return (
    <main className="min-h-screen bg-opus-charcoal px-6 pb-24 pt-[calc(var(--opus-header-plus-trust)+4rem)] text-opus-warm/80">
      <div className="mx-auto max-w-xl">
        <p className="opus-text-metallic-soft text-center text-xs uppercase tracking-[0.4em]">OPUS</p>
        <h1 className="mt-4 text-center font-display text-3xl tracking-[0.12em] text-opus-warm">{o.title}</h1>
        <p className="mt-3 text-center text-sm text-opus-warm/55">{o.subtitle}</p>

        <ArtistOnboardingProfileForm
          locale={locale}
          m={m}
          returnTo={returnTo}
          initialDisplayName={session.user.name ?? ""}
          initialBankName={payout?.bankName ?? ""}
          initialAccountHolder={payout?.accountHolder ?? ""}
          initialAccountNumber={payout?.accountNumber ?? ""}
        />

        <div className="mt-10 text-center">
          <Link
            href={withLocale(locale, "/")}
            className="text-sm text-opus-gold underline-offset-4 hover:text-opus-gold-light hover:underline"
          >
            {o.backToHome}
          </Link>
        </div>
      </div>
    </main>
  );
}
