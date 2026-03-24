import Link from "next/link";

export function SiteFooter() {
  return (
    <footer
      className="border-t border-opus-gold/12 bg-opus-charcoal"
      role="contentinfo"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-14 md:flex-row md:items-end md:justify-between md:px-10">
        <div>
          <p className="opus-text-metallic font-display text-sm font-semibold tracking-[0.35em]">OPUS</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-opus-warm/45">
            The archive of digital masterpieces — authenticated editions, collector provenance, and the
            vault.
          </p>
          <p className="mt-4 max-w-sm border-l border-opus-gold/38 pl-4 text-xs leading-relaxed text-opus-warm/35">
            Design: Classic Luxury — near-black charcoal, champagne brass (gradient-lit metal), warm white type,
            restrained decoration. Not an investment or real-world asset product.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-3 text-xs text-opus-warm/40">
          <Link href="/artworks" className="transition hover:text-opus-gold">
            Archive
          </Link>
          <Link href="/vault" className="transition hover:text-opus-gold">
            Vault
          </Link>
          <Link href="/tokushoho" className="transition hover:text-opus-gold">
            特定商取引法に基づく表記
          </Link>
        </div>
      </div>
      <div className="border-t border-white/[0.04] py-5 text-center text-[0.65rem] uppercase tracking-[0.2em] text-opus-warm/30">
        © {new Date().getFullYear()} OPUS
      </div>
    </footer>
  );
}
