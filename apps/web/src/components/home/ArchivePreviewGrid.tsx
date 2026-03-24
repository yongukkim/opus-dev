import Link from "next/link";

/**
 * Featured grid (pattern: Web_Template Purple Buzz work grid + Art Factory sections).
 */
const placeholders = [
  { id: "1", title: "Premiere I", meta: "Edition 1 / 42" },
  { id: "2", title: "Premiere II", meta: "Edition 2 / 42" },
  { id: "3", title: "Premiere III", meta: "Edition 3 / 42" },
  { id: "4", title: "Premiere IV", meta: "Edition 4 / 42" },
] as const;

export function ArchivePreviewGrid() {
  return (
    <section className="py-20 md:py-28" aria-labelledby="opus-archive-preview-heading">
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="opus-text-metallic-soft font-mono text-[0.65rem] uppercase tracking-[0.3em]">
              Archive preview
            </p>
            <h2
              id="opus-archive-preview-heading"
              className="opus-text-metallic mt-3 font-display text-2xl tracking-wide md:text-3xl"
            >
              From the vault
            </h2>
            <p className="mt-3 max-w-lg font-sans text-sm text-opus-warm/55">
              作家公式の認定版から、注目エディションを先行表示します。各カードで来歴と版情報を確認できます。
            </p>
          </div>
          <Link
            href="/artworks"
            className="shrink-0 border border-opus-gold/42 px-5 py-2.5 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-opus-gold transition hover:border-opus-gold-light/55 hover:bg-opus-gold/10"
          >
            View all
          </Link>
        </div>

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {placeholders.map((item) => (
            <li key={item.id}>
              <Link
                href="/artworks"
                className="group block overflow-hidden rounded-lg border border-white/[0.08] bg-opus-slate/30 shadow-opus-card transition hover:border-opus-gold/38"
              >
                <div className="aspect-[4/5] bg-gradient-to-b from-[#1f1f1f] to-opus-charcoal">
                  <div className="flex h-full items-center justify-center">
                    <span className="font-mono text-[0.6rem] uppercase tracking-[0.35em] text-opus-warm/25 transition group-hover:text-opus-gold/80">
                      Artwork
                    </span>
                  </div>
                </div>
                <div className="border-t border-white/[0.06] px-4 py-4">
                  <p className="opus-text-metallic font-display text-sm tracking-wide">{item.title}</p>
                  <p className="mt-1 font-mono text-[0.65rem] text-opus-warm/45">{item.meta}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
