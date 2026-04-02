import { getDictionary } from "@/i18n/catalog";
import { normalizeLocale, withLocale } from "@/i18n/paths";
import { sanitizeReturnTo } from "@/lib/returnTo";
import Link from "next/link";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ artwork?: string; returnTo?: string }>;
};

export default async function CheckoutPage({ params, searchParams }: Props) {
  const { locale: raw } = await params;
  const { artwork: artworkParam, returnTo: returnToParam } = await searchParams;
  const locale = normalizeLocale(raw);
  const m = getDictionary(locale);

  const artwork = (artworkParam ?? "").trim();
  const safeReturn = sanitizeReturnTo(returnToParam, withLocale(locale, "/vault"));
  const successHref = `${withLocale(locale, "/purchase/success")}?returnTo=${encodeURIComponent(
    safeReturn,
  )}${artwork ? `&artwork=${encodeURIComponent(artwork)}` : ""}`;

  return (
    <main className="min-h-screen bg-opus-charcoal px-6 pb-24 pt-[calc(6.5rem+4rem)] text-opus-warm/80">
      <div className="mx-auto max-w-xl">
        <p className="opus-text-metallic-soft text-center text-xs uppercase tracking-[0.4em]">OPUS</p>
        <h1 className="mt-4 text-center font-display text-3xl tracking-[0.12em] text-opus-warm">
          {m.checkout.title}
        </h1>
        <p className="mt-3 text-center text-sm text-opus-warm/55">{m.checkout.subtitle}</p>

        <div className="mt-10 overflow-hidden rounded-xl border border-white/[0.08] bg-opus-slate/30 shadow-opus-card">
          <div className="border-b border-white/[0.06] px-6 py-5">
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-opus-warm/45">
              {m.checkout.summaryLabel}
            </p>
            <p className="mt-3 font-sans text-sm text-opus-warm/80">
              {artwork ? m.checkout.summaryArtwork.replace("{artwork}", artwork) : m.checkout.summaryFallback}
            </p>
          </div>
          <div className="px-6 py-6">
            <Link
              href={successHref}
              className="opus-surface-metallic inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold tracking-[0.12em] text-black transition hover:opacity-95"
            >
              {m.checkout.payCta}
            </Link>
            <p className="mt-4 text-center text-xs text-opus-warm/45">{m.checkout.note}</p>
          </div>
        </div>

        <div className="mt-10 text-center">
          <Link
            href={withLocale(locale, "/artworks")}
            className="text-sm text-opus-gold underline-offset-4 hover:text-opus-gold-light hover:underline"
          >
            {m.checkout.back}
          </Link>
        </div>
      </div>
    </main>
  );
}

