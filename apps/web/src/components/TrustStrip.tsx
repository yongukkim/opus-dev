import Link from "next/link";

/**
 * Secondary trust / utility bar (pattern: Web_Template finance-business sub-header).
 * KO/JA/EN copy can move to i18n later; layout-only.
 */
const items = [
  { href: "/tokushoho", label: "特定商取引法に基づく表記" },
  { href: "/artworks", label: "The Chronicle" },
  { href: "/vault", label: "Vault" },
] as const;

export function TrustStrip() {
  return (
    <div
      className="fixed inset-x-0 top-[4.25rem] z-40 border-b border-white/[0.07] bg-opus-charcoal/78 backdrop-blur-md"
      role="navigation"
      aria-label="Utility"
    >
      <div className="mx-auto flex h-[2.25rem] max-w-6xl items-center justify-between gap-3 px-6 md:px-10">
        <p className="hidden max-w-[14rem] font-sans text-[0.6rem] leading-snug text-opus-warm/42 sm:block md:max-w-none md:text-[0.65rem]">
          <span className="opus-text-metallic-soft font-mono uppercase tracking-[0.18em]">Classic Luxury</span>
          <span className="mx-1.5 text-opus-warm/25">·</span>
          <span className="text-opus-warm/45">認定版 · 来歴 · 非投資商品</span>
        </p>
        <ul className="flex flex-1 items-center justify-end gap-4 sm:gap-6 md:flex-initial">
          {items.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className="whitespace-nowrap font-sans text-[0.65rem] text-opus-warm/50 transition hover:text-opus-gold md:text-xs"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
