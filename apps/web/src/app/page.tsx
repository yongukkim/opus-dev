import { DesignPhilosophyBand } from "@/components/DesignPhilosophyBand";
import { Hero } from "@/components/Hero";
import { ArchivePreviewGrid } from "@/components/home/ArchivePreviewGrid";
import { MarketingCtaBand } from "@/components/home/MarketingCtaBand";
import { StatsTrustRow } from "@/components/home/StatsTrustRow";
import { OpusButton } from "@opus/ui";
import Link from "next/link";

const pillars = [
  {
    title: "The Chronicle",
    subtitle: "改ざん耐性のある履歴",
    body: "所有と版の連鎖を一つの記録に。鑑定とエディションを明確に残します。",
  },
  {
    title: "The Vault",
    subtitle: "プライベート保管",
    body: "コレクションの所在とアクセスを、役割に応じて最小権限で制御します。",
  },
  {
    title: "Premieres",
    subtitle: "公式認定の作品",
    body: "作家公式の認定と限定版。モバイルで鑑賞、ウェブで手続きと決済。",
  },
] as const;

export default function HomePage() {
  return (
    <>
      <Hero />
      <DesignPhilosophyBand />
      <main
        id="main-content"
        className="border-t border-opus-gold/10 bg-gradient-to-b from-opus-charcoal via-[#141414] to-opus-charcoal"
      >
        <div className="mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
          <div className="max-w-2xl">
            <p className="opus-text-metallic-soft text-xs font-medium uppercase tracking-[0.4em]">
              OPUS
            </p>
            <h1 className="mt-5 font-display text-3xl font-normal leading-tight tracking-wide text-opus-warm md:text-4xl lg:text-[2.65rem]">
              写真とコレクションのための場所
            </h1>
            <p className="mt-6 font-sans text-base leading-relaxed text-opus-warm/72 md:text-lg">
              決済・案内はこのサイトで。作品の鑑賞はモバイルアプリから。
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-5">
              <OpusButton variant="primary">購入・決済へ</OpusButton>
              <Link
                href="/tokushoho"
                className="text-sm text-opus-warm/55 underline-offset-[5px] transition hover:text-opus-gold hover:underline"
              >
                特定商取引法に基づく表記
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
                  {item.subtitle}
                </p>
                <h2 className="opus-text-metallic mt-4 font-display text-xl font-semibold tracking-[0.08em] md:text-2xl">
                  {item.title}
                </h2>
                <p className="mt-4 font-sans text-sm leading-relaxed text-opus-warm/60">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>

        <StatsTrustRow />

        <ArchivePreviewGrid />

        <MarketingCtaBand />
      </main>
    </>
  );
}
