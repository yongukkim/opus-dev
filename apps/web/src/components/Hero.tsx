import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/types";
import { withLocale } from "@/i18n/paths";

/** Archive-style masonry tiles — design-spec PDF / monitor mockup rhythm. */
const TILES: { span: string; featured?: boolean }[] = [
  { span: "col-span-2 row-span-2 md:col-span-2" },
  { span: "col-span-1 row-span-1" },
  { span: "col-span-1 row-span-2" },
  { span: "col-span-2 row-span-1 md:col-span-2" },
  { span: "col-span-1 row-span-1", featured: true },
  { span: "col-span-1 row-span-1" },
  { span: "col-span-2 row-span-2 md:col-span-2" },
  { span: "col-span-1 row-span-1" },
  { span: "col-span-1 row-span-1" },
  { span: "col-span-2 row-span-1" },
  { span: "col-span-1 row-span-2" },
  { span: "col-span-1 row-span-1" },
];

/**
 * Landing hero — Classic Luxury + design-spec (glass panel, localized copy).
 */
export function Hero({ locale, m }: { locale: Locale; m: Messages }) {
  const h = m.hero;
  return (
    <section
      className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-opus-charcoal px-6 pb-28 pt-[calc(6.5rem+3rem)] md:pb-36 md:pt-[calc(6.5rem+4rem)]"
      aria-label={m.a11y.hero}
    >
      <div
        className="pointer-events-none absolute inset-0 grid auto-rows-[minmax(5.5rem,1fr)] grid-cols-4 gap-2 p-3 opacity-[0.42] md:grid-cols-6 md:gap-3 md:p-6"
        aria-hidden
      >
        {TILES.map((tile, i) => (
          <div
            key={i}
            className={`relative overflow-hidden rounded-sm border border-white/[0.07] bg-gradient-to-br from-[#1c1c1c] via-[#161616] to-[#121212] ${tile.span} ${
              tile.featured
                ? "z-[1] ring-1 ring-opus-gold/42 shadow-[0_0_36px_rgba(222,184,146,0.26)]"
                : ""
            }`}
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(222,184,146,0.1),transparent_55%)]" />
          </div>
        ))}
      </div>

      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-opus-charcoal/92 via-opus-charcoal/78 to-opus-charcoal/95"
        aria-hidden
      />

      <div className="relative z-10 mx-auto w-full max-w-2xl">
        <div className="rounded-2xl border border-white/[0.12] bg-white/[0.055] px-8 py-12 shadow-[0_24px_72px_rgba(0,0,0,0.42)] backdrop-blur-md md:px-14 md:py-14">
          <div className="flex flex-col items-center text-center">
            <p className="opus-text-metallic-soft text-[0.65rem] font-medium uppercase tracking-[0.45em] md:text-xs">
              {h.kicker}
            </p>

            <h1 className="relative mt-10 inline-block pb-8 text-center md:pb-9">
              <span className="opus-text-metallic block font-display text-[clamp(3.5rem,11.7vw,6.2rem)] font-semibold uppercase leading-[0.88] tracking-[0.14em] md:tracking-[0.18em]">
                OPUS
              </span>
              {/* OPUS→subtitle gap: 3px. */}
              <span className="opus-text-metallic absolute left-0 right-0 top-full mt-[3px] block font-display text-[clamp(0.64rem,2.1vw,0.9rem)] font-semibold uppercase leading-[1.05] tracking-[0.52em] sm:tracking-[0.58em] md:text-[clamp(0.72rem,1.9vw,1rem)] md:tracking-[0.66em] lg:tracking-[0.74em]">
                THE CHRONICLE
              </span>
            </h1>

            <p className="mt-12 max-w-lg font-sans text-sm leading-relaxed text-opus-warm/70 md:mt-14 md:text-[0.95rem]">
              {h.line1}
            </p>

            <p className="mt-4 max-w-md text-sm leading-relaxed tracking-wide text-opus-warm/50">{h.line2}</p>

            <p className="opus-text-metallic-soft mt-3 font-mono text-[0.65rem] uppercase tracking-[0.35em] opacity-90">
              Edition · The Log · Vault
            </p>

            <div className="mt-10 flex w-full flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href={withLocale(locale, "/artworks")}
                className="opus-surface-metallic inline-flex min-w-[14rem] items-center justify-center rounded-full px-10 py-3.5 text-xs font-semibold uppercase tracking-[0.22em] text-black transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-opus-gold-light/55 focus-visible:ring-offset-2 focus-visible:ring-offset-opus-charcoal md:min-w-[15rem] md:text-sm"
              >
                <span className="relative z-[1]">{h.exploreArchive}</span>
              </Link>
              <Link
                href={withLocale(locale, "/artworks")}
                className="opus-text-metallic-soft text-[0.7rem] font-medium uppercase tracking-[0.28em] underline-offset-4 transition hover:opacity-100 hover:underline"
              >
                {h.viewPremieres}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
