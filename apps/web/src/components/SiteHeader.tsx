import Link from "next/link";

const nav = [
  { href: "/artworks", label: "Archive" },
  { href: "/vault", label: "Vault" },
  { href: "/tokushoho", label: "Legal" },
] as const;

/**
 * Fixed top bar — charcoal glass, gold accents (Classic Luxury).
 */
export function SiteHeader() {
  return (
    <header
      className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.09] bg-opus-charcoal/72 backdrop-blur-xl"
      role="banner"
    >
      <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between px-6 md:px-10">
        <Link
          href="/"
          className="opus-text-metallic font-display text-lg font-semibold tracking-[0.42em] transition hover:opacity-90 md:text-xl"
        >
          OPUS
        </Link>
        <nav className="flex items-center gap-8 md:gap-10" aria-label="Primary">
          {nav.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-[0.7rem] font-medium uppercase tracking-[0.22em] text-opus-warm/65 transition hover:text-opus-gold md:text-xs md:tracking-[0.28em]"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
