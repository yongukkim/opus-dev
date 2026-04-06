import { DesignPhilosophyBand } from "@/components/DesignPhilosophyBand";
import { Hero } from "@/components/Hero";
import { ArchivePreviewGrid } from "@/components/home/ArchivePreviewGrid";
import { MarketingCtaBand } from "@/components/home/MarketingCtaBand";
import { StatsTrustRow } from "@/components/home/StatsTrustRow";
import { getDictionary } from "@/i18n/catalog";
import { normalizeLocale, withLocale } from "@/i18n/paths";
import { OpusButton } from "@opus/ui";
import Link from "next/link";

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = normalizeLocale(raw);
  const m = getDictionary(locale);

  const pillars = [
    { title: "The Chronicle" as const, ...m.home.pillarChronicle },
    { title: "The Vault" as const, ...m.home.pillarVault },
    { title: "Premieres" as const, ...m.home.pillarPremieres },
  ];

  return (
    <>
      <Hero locale={locale} m={m} />
      <DesignPhilosophyBand m={m} />
      <main
        id="main-content"
        className="border-t border-opus-gold/10 bg-gradient-to-b from-opus-charcoal via-[#141414] to-opus-charcoal"
      >
        <div className="mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
          <div className="max-w-2xl">
            <p className="opus-text-metallic-soft text-xs font-medium uppercase tracking-[0.4em]">
              {m.home.kicker}
            </p>
            <h1 className="mt-5 font-display text-3xl font-normal leading-tight tracking-wide text-opus-warm md:text-4xl lg:text-[2.65rem]">
              {m.home.title}
            </h1>
            <p className="mt-6 font-sans text-base leading-relaxed text-opus-warm/72 md:text-lg">{m.home.lead}</p>
            <div className="mt-10 flex flex-wrap items-center gap-5">
              <OpusButton variant="primary">{m.home.buyCta}</OpusButton>
              <Link
                href={withLocale(locale, "/tokushoho")}
                className="text-sm text-opus-warm/55 underline-offset-[5px] transition hover:text-opus-gold hover:underline"
              >
                {m.home.legalLink}
              </Link>
            </div>
          </div>

          <ul className="mt-20 grid gap-6 md:mt-24 md:grid-cols-3 md:gap-8">
            {pillars.map((item) => (
              <li
                key={item.title}
                className="group relative overflow-hidden rounded-xl border border-white/[0.08] bg-opus-slate/40 p-8 shadow-opus-card transition duration-500 hover:border-opus-gold/30 hover:bg-opus-slate/55"
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100"
                  style={{
                    background:
                      "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(197, 160, 40, 0.09), transparent 55%)",
                  }}
                />
                <p className="opus-text-metallic-soft font-mono text-[0.65rem] uppercase tracking-[0.28em] opacity-90">
                  {item.sub}
                </p>
                <h2 className="opus-text-metallic mt-4 font-display text-xl font-semibold tracking-[0.08em] md:text-2xl">
                  {item.title}
                </h2>
                <p className="mt-4 font-sans text-sm leading-relaxed text-opus-warm/60">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>

        <StatsTrustRow m={m} />

        <ArchivePreviewGrid locale={locale} m={m} />

        <MarketingCtaBand locale={locale} m={m} />
      </main>
    </>
  );
}
