import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/types";
import { withLocale } from "@/i18n/paths";
import { LocaleSwitcher } from "./LocaleSwitcher";

/**
 * Fixed top bar — charcoal glass, gold accents (Classic Luxury).
 * Locale control: KO / EN / JA (pattern: marketplace.aline.team).
 */
export function SiteHeader({ locale, m }: { locale: Locale; m: Messages }) {
  return (
    <header
      className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.09] bg-opus-charcoal/72 backdrop-blur-xl"
      role="banner"
    >
      <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between gap-2 px-4 sm:gap-3 sm:px-6 md:px-10">
        <Link
          href={withLocale(locale, "/")}
          className="opus-text-metallic shrink-0 font-display text-lg font-semibold tracking-[0.42em] transition hover:opacity-90 md:text-xl"
        >
          OPUS
        </Link>
        {/* LocaleSwitcher stays visible: shrink-0 + nav scrolls on narrow widths */}
        <div className="flex min-w-0 max-w-[min(100%,calc(100vw-5.5rem))] flex-1 items-center justify-end gap-2 sm:max-w-none sm:gap-3 md:gap-6">
          <nav
            className="flex min-w-0 shrink items-center justify-end gap-3 overflow-x-auto py-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-5 md:gap-8 lg:gap-10 [&::-webkit-scrollbar]:hidden"
            aria-label={m.a11y.primaryNav}
          >
            <Link
              href={withLocale(locale, "/artworks")}
              className="shrink-0 text-[0.7rem] font-medium uppercase tracking-[0.22em] text-opus-warm/65 transition hover:text-opus-gold md:text-xs md:tracking-[0.28em]"
            >
              {m.nav.archive}
            </Link>
            <Link
              href={withLocale(locale, "/vault")}
              className="shrink-0 text-[0.7rem] font-medium uppercase tracking-[0.22em] text-opus-warm/65 transition hover:text-opus-gold md:text-xs md:tracking-[0.28em]"
            >
              {m.nav.vault}
            </Link>
            <Link
              href={withLocale(locale, "/tokushoho")}
              className="hidden shrink-0 text-[0.7rem] font-medium uppercase tracking-[0.22em] text-opus-warm/65 transition hover:text-opus-gold sm:inline md:text-xs md:tracking-[0.28em]"
            >
              {m.nav.legal}
            </Link>
          </nav>
          <Link
            href={withLocale(locale, "/login")}
            className="hidden shrink-0 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-opus-warm/55 transition hover:text-opus-gold sm:inline"
          >
            {m.auth.signIn}
          </Link>
          <Link
            href={withLocale(locale, "/signup")}
            className="hidden shrink-0 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-opus-warm/55 transition hover:text-opus-gold sm:inline"
          >
            {m.signup.title}
          </Link>
          <LocaleSwitcher ariaLabel={m.a11y.language} />
        </div>
      </div>
    </header>
  );
}
