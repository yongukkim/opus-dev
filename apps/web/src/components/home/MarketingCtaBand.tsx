import Link from "next/link";
import { OpusButton } from "@opus/ui";

/**
 * Full-width CTA band (pattern: Web_Template finance / art-factory closing sections).
 */
export function MarketingCtaBand() {
  return (
    <section
      className="border-t border-opus-gold/15 bg-opus-slate/32 py-16 md:py-20"
      aria-label="Call to action"
    >
      <div className="mx-auto max-w-3xl px-6 text-center md:px-10">
        <p className="opus-text-metallic-soft font-mono text-[0.65rem] uppercase tracking-[0.32em]">
          OPUS
        </p>
        <h2 className="opus-text-metallic mt-4 font-display text-2xl tracking-wide md:text-3xl">
          コレクションを、公式の記録とともに。
        </h2>
        <p className="mx-auto mt-4 max-w-md font-sans text-sm text-opus-warm/55">
          アーカイブの閲覧、Vault の管理、決済はウェブから。鑑賞はアプリで。実物資産の投資商品ではなく、複製不可デジタルアートの体験を提供します。
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
          <OpusButton variant="primary">購入・決済へ</OpusButton>
          <Link
            href="/vault"
            className="opus-text-metallic-soft font-mono text-[0.7rem] uppercase tracking-[0.2em] underline-offset-4 transition hover:underline"
          >
            Open Vault
          </Link>
        </div>
      </div>
    </section>
  );
}
