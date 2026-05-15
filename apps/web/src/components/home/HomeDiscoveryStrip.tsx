import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/types";
import { withLocale } from "@/i18n/paths";

/**
 * Three-up discovery row inspired by B2B landing “Business” tiles (e.g. AhnLab CloudMate):
 * eyebrow label, equal-height cards, headline + one line + CTA — OPUS palette and copy only.
 */
export function HomeDiscoveryStrip({ locale, m }: { locale: Locale; m: Messages }) {
  const ja = locale === "ja";
  const d = m.home.discoveryStrip;
  const eyebrowClass = ja
    ? "font-mono text-[0.65rem] font-semibold tracking-tight text-opus-gold/85"
    : "font-mono text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-opus-gold/85";
  const titleClass = ja
    ? "mt-2 font-display text-lg font-semibold tracking-tight text-opus-warm/92"
    : "mt-2 font-display text-lg font-semibold uppercase tracking-[0.12em] text-opus-warm/92";
  const bodyClass = ja
    ? "mt-2 text-sm leading-relaxed tracking-tight text-opus-warm/50"
    : "mt-2 text-sm leading-relaxed text-opus-warm/50";
  const ctaClass = ja
    ? "mt-6 inline-flex items-center gap-1.5 font-mono text-[0.62rem] tracking-tight text-opus-gold transition group-hover:gap-2.5"
    : "mt-6 inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-opus-gold transition group-hover:gap-2.5";

  const cards = [
    { href: withLocale(locale, "/about"), title: m.nav.about, body: d.cardAboutBody },
    { href: withLocale(locale, "/releases"), title: m.nav.releases, body: d.cardReleasesBody },
    { href: withLocale(locale, "/featured-artists"), title: m.nav.artists, body: d.cardArtistsBody },
  ] as const;

  return (
    <section
      className="border-b border-opus-gold/10 bg-gradient-to-b from-[#0c0c0c] to-opus-charcoal py-10 md:py-12"
      aria-labelledby="opus-discovery-strip-heading"
    >
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <h2 id="opus-discovery-strip-heading" className={eyebrowClass}>
          {d.eyebrow}
        </h2>
        <p className="sr-only">{d.ariaLabel}</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {cards.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="group flex min-h-[11.5rem] flex-col justify-between rounded-xl border border-white/[0.1] bg-gradient-to-br from-white/[0.06] via-[#121212] to-opus-charcoal p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-opus-gold/42 hover:shadow-[0_14px_40px_rgba(0,0,0,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-opus-gold-light/45 focus-visible:ring-offset-2 focus-visible:ring-offset-opus-charcoal"
            >
              <div>
                <h3 className={titleClass}>{c.title}</h3>
                <p className={bodyClass}>{c.body}</p>
              </div>
              <span className={ctaClass}>
                {d.cta}
                <span aria-hidden className="translate-y-px">
                  →
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
