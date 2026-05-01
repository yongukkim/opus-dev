import { auth } from "@/auth";
import { CheckoutPayButton } from "@/components/checkout/CheckoutPayButton";
import { getDictionary } from "@/i18n/catalog";
import type { Locale } from "@/i18n/config";
import { normalizeLocale, withLocale } from "@/i18n/paths";
import { formatListPriceForLocale } from "@/lib/localePriceFromJpy";
import { getStripeServer } from "@/lib/stripeServer";
import { sanitizeReturnTo } from "@/lib/returnTo";
import Link from "next/link";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ artwork?: string; returnTo?: string; priceJpy?: string }>;
};

export default async function CheckoutPage({ params, searchParams }: Props) {
  const { locale: raw } = await params;
  const { artwork: artworkParam, returnTo: returnToParam, priceJpy: priceJpyParam } = await searchParams;
  const locale = normalizeLocale(raw) as Locale;
  const m = getDictionary(locale);
  const c = m.checkout;

  const artwork = (artworkParam ?? "").trim();
  const priceParsed = Number.parseInt((priceJpyParam ?? "").trim(), 10);
  const priceValid = Number.isFinite(priceParsed) && priceParsed > 0;
  const priceParts = priceValid ? formatListPriceForLocale(locale, priceParsed) : null;

  const safeReturn = sanitizeReturnTo(returnToParam, withLocale(locale, "/vault/collection"));
  const successHref = `${withLocale(locale, "/purchase/success")}?returnTo=${encodeURIComponent(
    safeReturn,
  )}${artwork ? `&artwork=${encodeURIComponent(artwork)}` : ""}`;

  const session = await auth();
  const stripeEnabled = Boolean(getStripeServer());

  const payCopy = {
    payCta: c.payCta,
    payStarting: c.payStarting,
    demoPayCta: c.demoPayCta,
    payError: c.payError,
    payMustSignIn: c.payMustSignIn,
    payArtistWrongRole: c.payArtistWrongRole,
    payNotConfigured: c.payNotConfigured,
  };

  return (
    <main className="min-h-screen bg-opus-charcoal px-6 pb-24 pt-[calc(var(--opus-header-plus-trust)+4rem)] text-opus-warm/80">
      <div className="mx-auto max-w-xl">
        <p className="opus-text-metallic-soft text-center text-xs uppercase tracking-[0.4em]">OPUS</p>
        <h1 className="mt-4 text-center font-display text-3xl tracking-[0.12em] text-opus-warm">{c.title}</h1>
        <p className="mt-3 text-center text-sm text-opus-warm/55">{c.subtitle}</p>

        <div className="mt-10 overflow-hidden rounded-xl border border-white/[0.08] bg-opus-slate/30 shadow-opus-card">
          <div className="border-b border-white/[0.06] px-6 py-5">
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-opus-warm/45">{c.summaryLabel}</p>
            <p className="mt-3 font-sans text-sm text-opus-warm/80">
              {artwork ? c.summaryArtwork.replace("{artwork}", artwork) : c.summaryFallback}
            </p>
            {priceParts?.primary ? (
              <div className="mt-2 space-y-1">
                <p className="font-mono text-sm text-opus-warm/65">
                  {c.summaryPrice.replace("{price}", priceParts.primary)}
                </p>
                {priceParts.showListBasis && c.summaryPriceBasis.trim() ? (
                  <p className="text-[0.65rem] leading-snug text-opus-warm/45">
                    {c.summaryPriceBasis.replace("{yen}", priceParts.listYenFormatted)}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="px-6 py-6">
            {priceValid ? (
              <CheckoutPayButton
                locale={locale}
                artwork={artwork}
                priceJpy={priceParsed}
                returnTo={safeReturn}
                successHref={successHref}
                stripeEnabled={stripeEnabled}
                isSignedIn={Boolean(session?.user)}
                isCollector={session?.user?.role === "collector"}
                copy={payCopy}
              />
            ) : (
              <p className="text-center text-sm text-opus-warm/55">{c.summaryFallback}</p>
            )}
            <p className="mt-4 text-center text-xs text-opus-warm/45">{c.note}</p>
          </div>
        </div>

        <div className="mt-10 text-center">
          <Link
            href={withLocale(locale, "/releases")}
            className="text-sm text-opus-gold underline-offset-4 hover:text-opus-gold-light hover:underline"
          >
            {c.back}
          </Link>
        </div>
      </div>
    </main>
  );
}
