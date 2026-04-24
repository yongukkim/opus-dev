import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/types";
import { withLocale } from "@/i18n/paths";

export function MarketingCtaBand({ locale, m }: { locale: Locale; m: Messages }) {
  const c = m.marketing;
  const ja = locale === "ja";
  const tight = ja ? "tracking-tight break-keep" : "";
  const secondaryLinkClass = ja
    ? "opus-text-metallic-soft font-mono text-[0.7rem] font-semibold tracking-tight break-keep underline-offset-4 transition hover:underline"
    : "opus-text-metallic-soft font-mono text-[0.7rem] uppercase tracking-[0.2em] underline-offset-4 transition hover:underline";

  return (
    <section
      className="border-t border-opus-gold/15 bg-opus-slate/32 py-16 md:py-20"
      aria-label={m.a11y.cta}
    >
      <div className="mx-auto max-w-3xl px-6 text-center md:px-10">
        <p className="opus-text-metallic-soft font-mono text-[0.65rem] uppercase tracking-[0.32em]">
          OPUS
        </p>
        <h2
          className={`opus-text-metallic mt-4 font-display text-2xl md:text-3xl ${ja ? "tracking-tight break-keep" : "tracking-wide"}`}
        >
          {c.title}
        </h2>
        <p className={`mx-auto mt-4 max-w-md font-sans text-sm text-opus-warm/55 ${tight}`}>{c.body}</p>
        <div className="mt-10 flex w-full max-w-md flex-col items-center gap-6 sm:max-w-none">
          <Link
            href={withLocale(locale, "/releases")}
            className={`inline-flex items-center justify-center rounded-sm px-5 py-2.5 text-sm font-medium text-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-opus-gold-light/60 focus-visible:ring-offset-2 focus-visible:ring-offset-opus-charcoal opus-surface-metallic ${
              ja ? "tracking-tight break-keep font-semibold" : ""
            }`.trim()}
          >
            {c.buy}
          </Link>
          <div className="flex w-full flex-wrap items-center justify-center gap-x-10 gap-y-3">
            <Link href={withLocale(locale, "/vault")} className={secondaryLinkClass}>
              {c.openVault}
            </Link>
            <Link href={withLocale(locale, "/provenance")} className={secondaryLinkClass}>
              {c.openProvenance}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
