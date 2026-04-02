import { getDictionary } from "@/i18n/catalog";
import { normalizeLocale, withLocale } from "@/i18n/paths";
import Link from "next/link";
import { ArtistKycConsentPanel } from "@/components/artist/ArtistKycConsentPanel";
import { sanitizeReturnTo } from "@/lib/returnTo";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ returnTo?: string }>;
};

export default async function ArtistKycConsentPage({ params, searchParams }: Props) {
  const { locale: raw } = await params;
  const { returnTo: returnToParam } = await searchParams;
  const locale = normalizeLocale(raw);
  const m = getDictionary(locale);

  const returnTo = sanitizeReturnTo(returnToParam, withLocale(locale, "/vault/submit"));
  const startHref = `${withLocale(locale, "/artist/kyc/start")}?returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <main className="min-h-screen bg-opus-charcoal px-6 pb-24 pt-[calc(6.5rem+4rem)] text-opus-warm/80">
      <div className="mx-auto max-w-xl">
        <p className="opus-text-metallic-soft text-center text-xs uppercase tracking-[0.4em]">OPUS</p>
        <h1 className="mt-4 text-center font-display text-3xl tracking-[0.12em] text-opus-warm">
          {m.artistKyc.consentTitle}
        </h1>
        <p className="mt-3 text-center text-sm text-opus-warm/55">{m.artistKyc.consentSubtitle}</p>

        <ArtistKycConsentPanel
          locale={locale}
          m={m}
          startHref={startHref}
          termsHref={withLocale(locale, "/terms")}
          privacyHref={withLocale(locale, "/privacy")}
        />

        <div className="mt-10 text-center">
          <Link
            href={withLocale(locale, "/vault")}
            className="text-sm text-opus-gold underline-offset-4 hover:text-opus-gold-light hover:underline"
          >
            {m.artistKyc.backToVault}
          </Link>
        </div>
      </div>
    </main>
  );
}

