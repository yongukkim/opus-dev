import Link from "next/link";
import { OpusButton } from "@opus/ui";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/types";
import { withLocale } from "@/i18n/paths";

export function MarketingCtaBand({ locale, m }: { locale: Locale; m: Messages }) {
  const c = m.marketing;
  const ja = locale === "ja";
  const tight = ja ? "tracking-tight break-keep" : "";

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
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
          <OpusButton
            variant="primary"
            className={ja ? "tracking-tight break-keep font-semibold" : undefined}
          >
            {c.buy}
          </OpusButton>
          <Link
            href={withLocale(locale, "/vault")}
            className={
              ja
                ? "opus-text-metallic-soft font-mono text-[0.7rem] font-semibold tracking-tight break-keep underline-offset-4 transition hover:underline"
                : "opus-text-metallic-soft font-mono text-[0.7rem] uppercase tracking-[0.2em] underline-offset-4 transition hover:underline"
            }
          >
            {c.openVault}
          </Link>
        </div>
      </div>
    </section>
  );
}
